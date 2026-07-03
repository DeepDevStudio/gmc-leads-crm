import CustomerGroupPage from "../components/CustomerGroupPage";

function Unsubscribed() {
  return (
    <CustomerGroupPage
      title="Unsubscribed Customers"
      description="Customers who have unsubscribed from messages"
      groupType="unsubscribed"
      color="gray"
      moveToGroup="Daily Reach"
      moveToLabel="Reactivate to Daily Reach"
      buttonLabel="Reactivate"
      icon="📤"
    />
  );
}

export default Unsubscribed;
