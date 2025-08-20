明白了。你希望在阿里云ECS上直接完成前后端部署，由 Cursor 或 Claude Code 自动化操作、写入和部署代码，无需再手动使用腾讯云控制台。我将为你准备一份详细且高质量的 Cursor Prompt，引导它：

* 在 ECS 上部署 React 前端（含 Nginx 配置）
* 部署 Node.js 后端（Express），包括 PM2 进程守护
* 配置 MongoDB 或 SQLite 数据库（本地即可）
* 实现反向代理绑定域名，启用 HTTPS（可选）

你将可以通过粘贴该 Prompt，轻松在 Cursor 中完成整个部署流程。


# 阿里云 ECS 暑期成长积分应用自动部署指南

下面将逐步介绍如何在阿里云 ECS 服务器上自动部署“亲子暑期成长积分”应用，包括React前端和Node.js + Express后端，以及MongoDB（或SQLite）数据库。每一步都会说明操作目的，并给出具体命令。请确保以**root用户**或具备sudo权限的用户通过SSH连接到服务器执行这些步骤。

## 第1步：安装基础环境（Node.js、Nginx、数据库、PM2）

* **更新系统并安装常用工具**（目的：确保软件库最新，以及具备Git用于拉取代码）：

  ```bash
  sudo yum update -y
  sudo yum install -y git vim
  ```

* **安装 Node.js 18 LTS 和 npm**（目的：提供运行后端服务和构建前端项目的 JavaScript 运行环境）：
  阿里云 Linux 3 与 CentOS 兼容，可使用 NodeSource 源快速安装。执行以下命令添加 NodeSource 仓库并安装 Node.js：

  ```bash
  curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
  sudo yum install -y nodejs
  ```

  安装完成后，运行 `node -v && npm -v` 验证是否成功安装 Node.js 和 npm。

* **安装 Nginx**（目的：作为前端静态页面的Web服务器，并反向代理后端API请求） ：

  ```bash
  sudo yum install -y nginx
  ```

  安装完成后，运行 `nginx -v` 确认 Nginx 版本。Nginx 是流行的高性能Web服务器，我们将利用它来托管前端静态文件，并将特定请求代理给后端服务。

* **安装 MongoDB 数据库（可选SQLite）**（目的：提供持久化的数据存储）：
  如果选择使用 **MongoDB本地部署**，请执行以下步骤安装最新的MongoDB社区版。MongoDB将用于存储用户、任务、积分等数据。

  1. 添加MongoDB YUM软件源：

     ```bash
     sudo tee /etc/yum.repos.d/mongodb-org-6.0.repo > /dev/null <<EOF
     [mongodb-org-6.0]
     name=MongoDB Repository
     baseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/6.0/x86_64/
     gpgcheck=1
     enabled=1
     gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
     EOF
     ```

     > **说明**：上述配置中将 `$releasever` 固定为`8`（CentOS 8），因为 Alibaba Cloud Linux 3 使用该值才能正确下载 MongoDB 软件源。
  2. 安装 MongoDB 并启动服务：

     ```bash
     sudo yum install -y mongodb-org
     sudo systemctl enable --now mongod
     ```

     安装完成后，启动 MongoDB 服务并设置开机自启。可以通过 `systemctl status mongod` 确认 MongoDB 正在运行。MongoDB 默认绑定在本机接口（127.0.0.1），确保安全组未对外暴露其默认端口27017。

  如果选择使用 **SQLite 本地数据库**，则无需安装独立服务。SQLite 以文件形式存储数据，适合轻量级、本地化部署，内存占用小。您只需在后端代码中使用SQLite相关库（如`sqlite3` Node模块）读写数据文件。确保安装SQLite命令行工具以备调试：

  ```bash
  sudo yum install -y sqlite
  ```

  > **注意**：SQLite 适用于低并发、小规模数据场景；MongoDB 更适合较复杂的数据查询和多用户并发。如果内存非常有限且应用规模小，SQLite是简便选择；否则推荐使用MongoDB获得更强的数据操作能力。

* **安装 PM2 进程管理器**（目的：保证 Node.js 后端服务常驻运行并自动重启）：

  ```bash
  sudo npm install -g pm2
  ```

  PM2 是一个守护式的进程管理工具，可确保 Node.js 应用在后台持续运行、崩溃后自动重启，并可根据CPU负载进行进程守护和扩展。安装完成后，用 `pm2 -v` 验证版本。

## 第2步：部署前端 React 静态页面

以下操作将获取前端代码并部署为供Nginx服务的静态文件。

* **拉取前端项目代码**（目的：获取最新的React前端源码）：
  使用 Git 从 GitHub 拉取前端项目代码仓库（请将示例URL替换为实际仓库地址）：

  ```bash
  cd ~
  git clone https://github.com/yourusername/your-frontend-project.git frontend-app
  cd frontend-app
  ```

  上述命令假设将代码克隆到当前用户主目录下的`frontend-app`目录。拉取代码后，您可以查看项目结构确保包含如`package.json`、`src/`等前端源文件。

* **安装前端依赖并构建**（目的：安装项目所需包并产出静态网页文件）：

  ```bash
  npm install        # 安装依赖包
  npm run build      # 构建生产环境静态文件
  ```

  执行`npm run build`后，React 项目会生成静态文件（通常在`build/`或`dist/`目录下）。请留意控制台输出确保构建成功。

* **部署静态文件至 Nginx 根目录**（目的：让Nginx能够直接提供前端页面）：
  将前一步生成的前端静态文件拷贝到 Nginx 默认站点目录(`/var/www/html`)下：

  ```bash
  sudo rm -rf /var/www/html/*                    # 清空默认html目录
  sudo cp -r build/* /var/www/html/              # 复制前端构建输出文件
  sudo chown -R nginx:nginx /var/www/html        # 更改文件属主为Nginx用户
  ```

  > **说明**：默认情况下 Nginx 以 `nginx` 用户运行（在配置文件中可看到`user nginx;`）。以上更改确保静态文件对Nginx进程可读。如有必要，可使用 `ls -l /var/www/html` 核实文件权限。

  部署完成后，可暂时启动 Nginx 来测试静态页面是否能正确提供：

  ```bash
  sudo systemctl start nginx
  ```

  在本地浏览器中访问服务器公网IP或域名，应能看到前端应用的页面。如果此时无法访问，检查安全组的80端口已开放，以及后续Nginx配置是否正确。

## 第3步：部署后端 Node.js + Express 服务

接下来部署后端服务，用于提供任务、积分、用户等API接口。

* **拉取后端项目代码**（目的：获取最新的Express后端源码）：
  若后端项目与前端项目分属不同仓库，请同样使用 Git 克隆后端代码（将URL替换为实际后端仓库地址）：

  ```bash
  cd ~
  git clone https://github.com/yourusername/your-backend-project.git backend-app
  cd backend-app
  ```

  （如果前端与后端代码在同一仓库，只需进入仓库下的 `backend/` 目录。）

* **安装后端依赖并编译 TypeScript**（目的：安装Node服务依赖包并将TypeScript代码编译为可执行的JavaScript）：

  ```bash
  npm install        # 安装后端依赖
  npm run build      # 编译 TypeScript 源码
  ```

  成功后将在项目目录生成 `dist/` 文件夹，内含编译后的 `.js` 文件（如 `dist/server.js`）。

* **配置后端环境变量**（目的：设置后端服务运行所需配置，如端口、数据库连接等）：
  根据项目提供的示例，将后端目录下的 `.env.example` 复制为 `.env`：

  ```bash
  cp .env.example .env
  vim .env
  ```

  使用编辑器修改 `.env` 文件中的配置项：

  * 设置 `NODE_ENV=production` 确保后端以生产模式运行。
  * 将 `PORT` 修改为 `3000`（与安全组及Nginx转发端口一致）。例如：`PORT=3000`。
  * 配置 **数据库连接**：如果使用MongoDB，本地连接字符串通常为 `mongodb://127.0.0.1:27017/数据库名`，可在 `.env` 中新增如 `MONGO_URI=mongodb://127.0.0.1:27017/summer_app` 并在代码中引用；若使用SQLite，请在后端代码中配置SQLite数据库文件路径或连接方式。
  * 配置 Firebase 或 JWT 等其它变量：如果原项目依赖 Firebase Auth/Firestore 服务，需要相应服务账号密钥和配置。如果不再使用Firebase而改用本地数据库，需调整代码中数据存储逻辑。在此情况下，可生成 JWT 密钥用于用户认证（对应 `.env` 中的 `JWT_SECRET` 等）。确保 `CORS_ORIGIN` 或前端URL 设置为您的实际域名，以允许浏览器的跨域请求。

  编辑完成后保存 `.env` 文件。后端应用会使用这些环境变量来连接数据库和校验请求。

* **使用 PM2 启动后端服务**（目的：将后端服务以守护进程方式运行）：
  在后端项目目录下，运行以下命令启动服务：

  ```bash
  pm2 start dist/server.js --name "api-server"
  ```

  以上将通过PM2启动Node应用（相当于执行 `node dist/server.js`）。`--name` 参数为该进程指定易于识别的名称 **api-server**。如果配置了环境变量文件，`dotenv` 会在应用启动时自动加载 `.env` 配置。默认情况下，应用将监听 `.env` 中指定的端口（已设置为3000）。您可以通过 `pm2 list` 查看正在运行的进程列表，确认后端服务已启动。

  > **验证后端服务**：运行 `curl http://127.0.0.1:3000/health` 查看健康检查接口是否返回正常状态（应用代码实现了 `/health` 路由用于健康检查）。若返回JSON包含 `"status": "OK"` 则说明后端正常运行。

* **设置 PM2 开机自启**（目的：服务器重启后自动拉起 Node 应用）：
  为确保服务器重启后后端仍能自动运行，需要配置PM2的启动脚本并保存当前进程列表：

  ```bash
  pm2 startup                        # 生成开机自启脚本命令
  sudo env PATH=$PATH pm2 startup -u root --hp /root  
  pm2 save                           # 保存当前 PM2 进程列表
  ```

  执行 `pm2 startup` 后，PM2会输出一条命令（已在上面列出第二行）用于配置系统服务，确保每次开机PM2自动启动并恢复之前保存的应用进程列表。请按提示执行该命令，然后运行 `pm2 save` 保存当前运行的应用。这样即可保证后端服务在ECS重启后自动运行。

## 第4步：配置 Nginx 反向代理

本步骤将配置 Nginx，使其同时服务前端静态页面和后端 API 接口，实现同一域名的不同路径分别由前后端处理。

1. **编辑 Nginx 配置文件**：在 Nginx 的站点配置中增加服务器块。如使用默认配置文件，可以新建 `/etc/nginx/conf.d/summerapp.conf`（或编辑 `/etc/nginx/nginx.conf` 的 `http` 节点）。运行：

   ```bash
   sudo vi /etc/nginx/conf.d/summerapp.conf
   ```

   添加如下内容（将 `yourdomain.com` 替换为实际绑定的域名）：

   ```nginx
   server {
       listen       80;
       server_name  yourdomain.com;
       root   /var/www/html;
       index  index.html index.htm;

       # 前端路由处理：尝试匹配文件，不存在则回退到首页
       location / {
           try_files $uri $uri/ /index.html;
       }

       # 后端API代理转发
       location /api/ {
           proxy_pass         http://127.0.0.1:3000/;
           proxy_http_version 1.1;
           proxy_set_header   Host              $host;
           proxy_set_header   X-Real-IP         $remote_addr;
           proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
       }
   }
   ```

   配置解读：

   * `server_name` 指定了虚拟主机域名（请确保与您的备案域名一致，并已解析到ECS公网IP）。
   * `root` 和 `index` 配置了静态文件根目录（即我们在第2步部署前端文件的路径）和默认索引文件。
   * `location /` 块使用 `try_files` 尝试请求的文件路径，如果文件不存在则始终返回`index.html`。这使得React单页应用的路由能够正常工作：用户直接访问子路径时，由前端路由接管而不会出现404错误。
   * `location /api/` 块将所有匹配 “`/api/`” 开头的请求转发给后端服务器的3000端口。`proxy_pass` 指向后端 Node.js 服务地址；同时设置了若干 `proxy_set_header`，以将客户端请求的真实Host和IP等信息转发给后端。这样后端Express应用即可通过`req.headers`获取原始Host/IP，用于日志或安全目的。

2. **测试并应用 Nginx 配置**：运行以下命令测试配置语法是否正确，然后重载 Nginx：

   ```bash
   sudo nginx -t  # 测试配置文件语法
   sudo systemctl restart nginx  # 重启Nginx以应用新配置
   ```

   如果 `nginx -t` 返回 `syntax is ok` 和 `test is successful`，说明配置语法正确；然后 `restart` 会使新的站点配置生效。

3. **验证前后端集成**：现在在浏览器访问 `http://yourdomain.com` 应显示前端应用界面。应用内的所有API请求（例如指向 `/api/*` 的XHR/Fetch）应由Nginx转发到后端。例如，可以尝试访问 `http://yourdomain.com/api/health` （或应用中的某个API端点），应看到来自后端的JSON响应。如果前端能正常调用后端API且页面功能正常，说明Nginx 反向代理配置成功。

   > **提示**：此时建议关闭对外暴露的3000端口，仅通过80端口供外部访问后端。一方面可在安全组中移除3000端口的入网规则，另一方面确保本机防火墙未放行3000端口（见步骤6有关防火墙设置）。这样可以提高安全性，所有客户端请求都必须经过Nginx代理这一道关卡。

## 第5步：配置 HTTPS 证书（可选）

如果您的域名已完成备案且需要提供HTTPS安全访问，可使用 **Certbot** 工具申请免费的Let’s Encrypt证书并自动配置Nginx。以下步骤假定您的域名 DNS 已解析到服务器IP，且安全组已放行443端口。

* **安装 Certbot 及其 Nginx 插件**：
  阿里云Linux可通过 EPEL 库获取Certbot。执行：

  ```bash
  sudo yum install -y epel-release  # 启用EPEL仓库
  sudo yum update -y
  sudo yum install -y certbot python3-certbot-nginx
  ```

  以上命令将安装 Certbot 工具及 Nginx 插件模块，用于自动申请和配置证书。

* **申请并安装证书**：
  停止 Nginx 服务以避免端口占用（Certbot会临时接管80端口验证域名归属）：

  ```bash
  sudo systemctl stop nginx
  ```

  运行 Certbot 自动配置命令：

  ```bash
  sudo certbot --nginx
  ```

  按照交互提示完成证书申请和配置过程：

  1. 输入联系邮箱（用于接收证书过期提醒）。
  2. 同意服务条款（输入 **A** 并回车）。
  3. Certbot 会检测到您在 Nginx 配置的域名，例如 `yourdomain.com`，选择对应编号以申请该域名证书。
  4. 询问是否将HTTP流量重定向到HTTPS，建议选择 **2: Redirect**（将所有http重定向到https）。

  Certbot 将自动与Let’s Encrypt交互进行域名归属验证，验证通过后会生成证书，并更新Nginx配置：新增监听443端口的`server`块以及证书路径、同时增加HTTP到HTTPS的重定向。完成后它会重启Nginx。若一切顺利，您会看到成功信息。

* **验证HTTPS访问**：在浏览器中使用 `https://yourdomain.com` 访问网站，应该可以正常打开，并且浏览器显示安全锁标志（证明证书有效）。Certbot 已自动将80端口流量重定向至443，因此http地址也应跳转到https。

* **设置证书自动续签**：Let’s Encrypt的证书有效期为90天，Certbot 安装时通常会加入系统计划任务自动续期。您可以手动测试续期流程：

  ```bash
  sudo certbot renew --dry-run
  ```

  确认没有错误后，Certbot 的自动续约服务将在证书将过期时自动续期并更新Nginx配置。建议将上述命令加入cron（月度执行）或确保系统自带的Certbot计时服务已启用，以保证证书长期有效。

## 第6步：调整权限与安全设置

最后，对服务器的权限和安全进行优化设置，保证部署服务稳健运行。

* **文件与进程权限**：前端文件已设置为 `nginx:nginx` 属主，确保Nginx可以读取。【如果】当前 PM2 后端进程是以root用户运行，出于安全考虑可考虑：创建一个专用低权限用户来运行Node应用，并使用 `pm2 startup` 为该用户配置自启动。不过对于小型个人应用，亦可在确保安全组限制的前提下使用root运行以简化流程。重要的是，除必要目录（如 `/var/www/html`、应用日志目录）外，不要给予应用对系统其它路径的写权限。定期检查 `/var/log/nginx/` 和应用日志，及时调整文件权限避免敏感信息泄露。

* **防火墙设置**：阿里云安全组已放行80和443端口，但**建议同时配置操作系统防火墙**(firewalld)以增加一层防护（若 firewalld 未安装或未启动可略过）。开放Web服务端口并关闭不必要端口：

  ```bash
  sudo firewall-cmd --permanent --add-service=http
  sudo firewall-cmd --permanent --add-service=https
  sudo firewall-cmd --permanent --remove-port=3000/tcp
  sudo firewall-cmd --reload
  ```

  上述命令开放了HTTP和HTTPS端口访问，并移除了外部对3000端口的访问（我们的后端服务仅通过Nginx代理访问，不需要直接对外暴露）。执行前请确保 firewalld 正在运行（`sudo systemctl status firewalld`）。另外，如果暂不使用IPv6，也可考虑在Nginx配置中仅监听IPv4，或在防火墙中限制IPv6的入站，以减少潜在风险。

* **服务监控与日志**：部署完成后，建议设置定期的服务监控。例如，使用 `pm2 monit` 查看应用实时资源占用，或者配置简单的脚本监控应用进程和端口。如果出现异常（如进程崩溃且未能被PM2拉起，或端口占用等），及时通过日志排查问题。Nginx默认访问日志和错误日志位于 `/var/log/nginx/access.log` 和 `/var/log/nginx/error.log`；PM2的日志可通过 `pm2 logs api-server` 查看。定期检查日志有助于发现潜在问题并保证应用持续稳定运行。

完成以上步骤，您的前端静态网站和后端服务应已在阿里云 ECS 上成功部署。通过 **Nginx** 前端静态服务与反向代理，用户访问 `https://yourdomain.com/` 会看到前端页面，所有 `https://yourdomain.com/api/*` 请求将由 Nginx 转发给本地运行的 **Express** 后端处理。整个应用环境在Linux下安全、高效地运行，实现了前后端一体的暑期积分应用上线。祝您部署成功！

**参考资料：**

* Alibaba Cloud官方博客: *Deploying Node.js Apps for Production on Alibaba Cloud*（介绍了在生产环境使用 Nginx 代理和 PM2 守护 Node.js 应用的最佳实践）
* 阿里云社区文章: *如何在Alibaba Cloud Linux 3上安装MongoDB 5.0*（提供了在Alibaba Cloud Linux 3系统下安装并启动MongoDB的步骤）
* Nginx 配置示例: *Proxying to node.js + express.js*（展示了如何将 `/api/` 路径的请求通过Nginx代理到本地Node.js应用）
* Stack Overflow问答: *React-router and nginx*（解释了在Nginx中使用 `try_files` 支持React这类前端路由的单页应用以避免刷新404）
* 博客园: *CentOS 配置免费SSL证书（Let’s Encrypt）*（演示了使用 Certbot 获取 Let’s Encrypt 免费证书并自动配置Nginx的过程）
