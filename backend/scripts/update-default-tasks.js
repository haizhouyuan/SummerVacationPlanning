const fs = require('fs');
const path = require('path');

// Read the defaultTasks.ts file
const filePath = path.join(__dirname, '../src/utils/defaultTasks.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Function to get activity from task title and category
const getActivityFromTask = (title, category) => {
  const lowerTitle = title.toLowerCase();
  
  // Check specific keywords in title
  if (lowerTitle.includes('日记')) return 'diary';
  if (lowerTitle.includes('数学') || lowerTitle.includes('计算')) return 'math_video';
  if (lowerTitle.includes('奥数')) return 'olympiad_problem';
  if (lowerTitle.includes('编程') || lowerTitle.includes('代码')) return 'programming_game';
  if (lowerTitle.includes('音乐') || lowerTitle.includes('钢琴') || lowerTitle.includes('吉他')) return 'music_practice';
  if (lowerTitle.includes('运动') || lowerTitle.includes('跑步') || lowerTitle.includes('跳绳') || lowerTitle.includes('篮球')) return 'general_exercise';
  if (lowerTitle.includes('家务') || lowerTitle.includes('打扫') || lowerTitle.includes('整理')) return 'chores';
  if (lowerTitle.includes('阅读') || lowerTitle.includes('读书')) return 'reading_general';
  if (lowerTitle.includes('画画') || lowerTitle.includes('手工') || lowerTitle.includes('制作')) return 'creativity_general';
  
  // Fall back to category-based mapping
  switch (category) {
    case 'exercise':
      return 'general_exercise';
    case 'reading':
      return 'reading_general';
    case 'chores':
      return 'chores';
    case 'learning':
      return 'learning_general';
    case 'creativity':
      return 'creativity_general';
    default:
      return 'general';
  }
};

// Regular expression to match task objects
const taskRegex = /{[^}]*title:\s*['"]([^'"]+)['"][^}]*category:\s*['"]([^'"]+)['"][^}]*}/gs;

// Replace each task object to add activity field
content = content.replace(taskRegex, (match, title, category) => {
  // Check if activity field already exists
  if (match.includes('activity:')) {
    return match;
  }
  
  const activity = getActivityFromTask(title, category);
  
  // Insert activity field after category
  return match.replace(
    /category:\s*['"]([^'"]+)['"],/,
    `category: '$1',\n    activity: '${activity}',`
  );
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully updated defaultTasks.ts with activity fields');