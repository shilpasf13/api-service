export function getEmailByContactType(employeeData: any) {
  const personalEmail = employeeData.EmailAddresses.find(
    (email: any) => email.ContactType === "Personal Email"
  );
  const businessEmail = employeeData.EmailAddresses.find(
    (email: any) => email.ContactType === "Business Email"
  );

  return { personalEmail, businessEmail };
}

export function getFormattedDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");

  const formattedDate = `${year}/${month}/${day}`;
  return formattedDate;
}
