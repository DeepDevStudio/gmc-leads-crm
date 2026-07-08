import CustomerGroupPage from "../components/CustomerGroupPage";

function DoNotReach() {
  return (
    <CustomerGroupPage
      title="Do Not Reach Customers"
      description="Customers who should not receive messages"
      groupType="Do Not Reach"
      color="red"
      moveToGroup="Daily Reach"
      moveToLabel="Move to Daily Reach"
      buttonLabel="Move to DR"
      icon="🚫"
    />
  );
}

export default DoNotReach;
