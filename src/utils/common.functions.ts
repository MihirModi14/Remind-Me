export const formatTimeTo12Hour = (date: string) => {
  const options: any = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return new Date(date).toLocaleTimeString("en-US", options).toString();
};
