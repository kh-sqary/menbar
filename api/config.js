export default function handler(req, res) {
  const scriptContent = `
    window.KhotbaConfig = {
      GROQ_API_KEY: "${process.env.GROQ_API_KEY || ''}",
      ASSEMPLY_API_KEY: "${process.env.ASSEMPLY_API_KEY || process.env.ASSEMBLY_API_KEY || ''}"
    };
  `;
  res.setHeader('Content-Type', 'application/javascript');
  res.status(200).send(scriptContent);
}
