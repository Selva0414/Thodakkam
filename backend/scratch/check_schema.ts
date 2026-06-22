import { findStudentById } from '../models/studentModel';

async function main() {
  try {
    const student = await findStudentById(7);
    console.log("Student 7:", student);
  } catch (err) {
    console.error("Error fetching student 7:", err);
  }
}

main().then(() => process.exit(0));
