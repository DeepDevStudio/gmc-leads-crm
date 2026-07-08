import CustomerGroupPage from "../components/CustomerGroupPage";

function DailyReach() {
  return (
    <CustomerGroupPage
      title="Daily Reach Customers"
      description="Customers who receive daily messages"
      groupType="Daily Reach"
      color="green"
      moveToGroup="Do Not Reach"
      moveToLabel="Move to Do Not Reach"
      buttonLabel="Move to DNR"
      icon="📧"
    />
  );
}

export default DailyReach;
