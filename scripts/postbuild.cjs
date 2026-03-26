const fs = require("fs");
const path = require("path");

const projectRoot = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const generatedSourceDir = path.join(projectRoot, "src", "generated");
const generatedDistDir = path.join(projectRoot, "dist", "generated");
const prismaDistFile = path.join(projectRoot, "dist", "lib", "prisma.js");

if (!fs.existsSync(generatedSourceDir)) {
  throw new Error(`Missing generated source directory: ${generatedSourceDir}`);
}

fs.mkdirSync(path.dirname(generatedDistDir), { recursive: true });
fs.cpSync(generatedSourceDir, generatedDistDir, { recursive: true });

if (fs.existsSync(prismaDistFile)) {
  const prismaContents = fs.readFileSync(prismaDistFile, "utf8");
  const updatedContents = prismaContents.replace(
    /@\/generated\/prisma/g,
    "./generated/prisma",
  );

  if (updatedContents !== prismaContents) {
    fs.writeFileSync(prismaDistFile, updatedContents, "utf8");
  }
}
