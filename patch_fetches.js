const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

code = code.replace(
  'setProjects(response.data);',
  'setProjects(Array.isArray(response.data) ? response.data : []);'
);

code = code.replace(
  'setTasks(response.data);',
  'setTasks(Array.isArray(response.data) ? response.data : []);'
);

code = code.replace(
  'setAnalysts(response.data);',
  'setAnalysts(Array.isArray(response.data) ? response.data : []);'
);

code = code.replace(
  'setDocuments(response.data);',
  'setDocuments(Array.isArray(response.data) ? response.data : []);'
);

fs.writeFileSync('frontend/src/App.tsx', code);
