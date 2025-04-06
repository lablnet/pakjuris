/**
 * Generates a random number with the specified number of digits.
 *
 * @param length - The number of digits for the generated random number.
 * 
 * @returns A random number with exactly the specified number of digits.
 */
const generateRandomNumber = (length: number): number => {
  // Validate the input
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error("Length must be a positive integer.");
  }

  // For length 1, return a number between 0 and 9 inclusive
  if (length === 1) {
    return Math.floor(Math.random() * 10);
  }

  // Calculate the minimum and maximum numbers for the given length
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  // Generate and return the random number within the range [min, max]
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const generateRandomCode = (length: number): string => {
  // Generate a random number with the specified number of digits
  const randomNumber = generateRandomNumber(length);

  // Convert the number to a string and return it
  return randomNumber.toString();
}

export {
    generateRandomNumber,
    generateRandomCode
};
