import re
import os

filepath = os.path.join(os.getcwd(), 'public/style.css')
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all strict "background: white" with "background: var(--white)"
content = re.sub(r'background:\s*white;', 'background: var(--white);', content, flags=re.IGNORECASE)
content = re.sub(r'background:\s*#fff;', 'background: var(--white);', content, flags=re.IGNORECASE)
content = re.sub(r'background-color:\s*white;', 'background-color: var(--white);', content, flags=re.IGNORECASE)
content = re.sub(r'background-color:\s*#fff;', 'background-color: var(--white);', content, flags=re.IGNORECASE)

# Append Animations
animations = """
/* ============================================
   ANIMATIONS
   ============================================ */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-7px); }
  100% { transform: translateY(0px); }
}

@keyframes pulse-shadow {
  0% { box-shadow: 0 0 0 0 rgba(95, 168, 211, 0.4); transform: scale(1); }
  50% { box-shadow: 0 0 0 10px rgba(95, 168, 211, 0); transform: scale(1.02); }
  100% { box-shadow: 0 0 0 0 rgba(95, 168, 211, 0); transform: scale(1); }
}

.floating-icon i,
.stat-card-icon i,
.feature-icon i,
.fi-1 i, .fi-2 i, .fi-3 i {
  animation: float 4s ease-in-out infinite;
}

.team-image-wrapper {
  overflow: hidden;
  border-radius: var(--radius-sm);
  position: relative;
  /* Apply animation to Khaled and Mohamed's parent container */
  animation: pulse-shadow 3s infinite;
}
"""

content += animations

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("style.css updated successfully.")
