export function getEmailByContactType(employeeData: any) {
  const personalEmail = employeeData.EmailAddresses.find(
    (email: any) => email.ContactType === "Personal Email"
  );
  const businessEmail = employeeData.EmailAddresses.find(
    (email: any) => email.ContactType === "Business Email"
  );

  return { personalEmail, businessEmail };
}
