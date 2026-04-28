const fs = require('fs');
require('dotenv').config();

const targetPath = './src/environments/environment.ts';
const targetPathProd = './src/environments/environment.prod.ts';

// En desarrollo usamos el proxy '/api' para evitar problemas de CORS
const envConfigFile = `export const environment = {
  production: false,
  apiUrl: '/api',
  wsUrl: '${process.env['WS_BASE_URL'] || 'http://localhost:3001'}'
};
`;

// En producción usamos la IP real
const envConfigFileProd = `export const environment = {
  production: true,
  apiUrl: '${process.env['API_BASE_URL'] || 'http://localhost:3002/api'}',
  wsUrl: '${process.env['WS_BASE_URL'] || 'http://localhost:3001'}'
};
`;

console.log('Generating environment files...');

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) {
    console.log(err);
  }
  console.log(`Environment file generated at ${targetPath}`);
});

fs.writeFile(targetPathProd, envConfigFileProd, function (err) {
  if (err) {
    console.log(err);
  }
  console.log(`Environment file generated at ${targetPathProd}`);
});
