import { hashPassword } from "@/modules/identidad/domain/password";

const password = process.argv[2];

if (!password) {
  console.error('Uso: npm run hash-password -- "TuClaveSegura"');
  process.exit(1);
}

console.log(await hashPassword(password));
