#!/usr/bin/env python3

import re

# 读取文件
with open('/root/projects/SummerVacationPlanning/frontend/public/index_working.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复重复的isParent声明
pattern = r'console\.log\("setupUserInterface called - v2\.0"\);\s*console\.log\("currentUser:", currentUser\);\s*const isParent = currentUser && currentUser\.role === "parent";\s*console\.log\("isParent:", isParent\);\s*alert\("Debug: setupUserInterface called, isParent=" \+ isParent\);\s*console\.log\(\'setupUserInterface called\'\);\s*console\.log\(\'currentUser:\', currentUser\);\s*const isParent = currentUser && currentUser\.role === \'parent\';\s*console\.log\(\'isParent:\', isParent\);'

replacement = '''console.log('setupUserInterface called');
            console.log('currentUser:', currentUser);
            const isParent = currentUser && currentUser.role === 'parent';
            console.log('isParent:', isParent);'''

content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)

# 保存修复后的文件
with open('/root/projects/SummerVacationPlanning/frontend/public/index_fixed.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("HTML文件已修复，保存为 index_fixed.html")