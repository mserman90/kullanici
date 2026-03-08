/**
 * Generates common username variations from first and last name.
 */
export function generateUsernames(firstName: string, lastName: string): string[] {
  const f = firstName.toLowerCase().trim();
  const l = lastName.toLowerCase().trim();
  if (!f || !l) return [];

  const fi = f[0]; // first initial
  const li = l[0]; // last initial

  const variations = new Set<string>([
    // Basic combinations
    `${f}${l}`,          // johndoe
    `${f}.${l}`,         // john.doe
    `${f}_${l}`,         // john_doe
    `${f}-${l}`,         // john-doe
    `${l}${f}`,          // doejohn
    `${l}.${f}`,         // doe.john
    `${l}_${f}`,         // doe_john

    // Initials
    `${fi}${l}`,         // jdoe
    `${fi}.${l}`,        // j.doe
    `${fi}_${l}`,        // j_doe
    `${f}${li}`,         // johnd
    `${f}.${li}`,        // john.d
    `${fi}${li}`,        // jd

    // With numbers
    `${f}${l}1`,         // johndoe1
    `${f}${l}123`,       // johndoe123
    `${f}.${l}1`,        // john.doe1
    `${fi}${l}1`,        // jdoe1

    // Reversed with initials
    `${l}${fi}`,         // doej
    `${l}.${fi}`,        // doe.j
    `${l}_${fi}`,        // doe_j
  ]);

  return Array.from(variations);
}
