const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'public/style.css');
let content = fs.readFileSync(file, 'utf8');

// Replace all strict "background: white" with "background: var(--white)"
content = content.replace(/background:\s*white;/gi, "background: var(--white);");
content = content.replace(/background:\s*#fff;/gi, "background: var(--white);");
content = content.replace(/background-color:\s*white;/gi, "background-color: var(--white);");
content = content.replace(/background-color:\s*#fff;/gi, "background-color: var(--white);");

// Append Animations
const animations = `
/* ============================================
   ANIMATIONS
   ============================================ */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

@keyframes pulse-shadow {
  0% { box-shadow: 0 0 0 0 rgba(95, 168, 211, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(95, 168, 211, 0); }
  100% { box-shadow: 0 0 0 0 rgba(95, 168, 211, 0); }
}

.floating-icon i,
.stat-card-icon i,
.feature-icon i {
  animation: float 4s ease-in-out infinite;
}

.team-image-wrapper {
  overflow: hidden;
  border-radius: var(--radius-sm);
  position: relative;
  /* Apply animation to Khaled and Mohamed's parent container */
  animation: pulse-shadow 3s infinite;
}
`;

content += animations;

fs.writeFileSync(file, content, 'utf8');
console.log('style.css updated successfully.');
