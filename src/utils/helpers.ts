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

export const isWithinLastFourteenDays = (dateOfHire: string): boolean => {
  const hireDate = new Date(dateOfHire);
  const currentDate = new Date();
  const fourteenDaysInMs = 14 * 24 * 60 * 60 * 1000;
  const differenceInMs = currentDate.getTime() - hireDate.getTime();
  return differenceInMs < fourteenDaysInMs;
};
