const { databaseService } = require("../src/services/database");

async function addSampleCustomers() {
  try {
    await databaseService.initialize();

    const sampleCustomers = [
      {
        name: "John Doe",
        phone: "+2348012345678",
        email: "john@example.com",
        address: "123 Lagos Street, Lagos",
        company: "Tech Solutions Ltd",
        jobTitle: "CEO",
        contactSource: "referral",
        preferredContactMethod: "email",
      },
      {
        name: "Jane Smith",
        phone: "+2348023456789",
        email: "jane@company.com",
        address: "456 Abuja Road, Abuja",
        company: "Business Corp",
        jobTitle: "Manager",
        contactSource: "website",
        preferredContactMethod: "phone",
      },
      {
        name: "Mike Johnson",
        phone: "+2348034567890",
        email: "mike@personal.com",
        address: "789 Individual Street",
        contactSource: "manual",
        preferredContactMethod: "phone",
      },
      {
        name: "Sarah Wilson",
        phone: "+2348045678901",
        email: "sarah@email.com",
        address: "321 Customer Lane",
        contactSource: "social_media",
        preferredContactMethod: "email",
      },
      {
        name: "David Brown",
        phone: "+2348056789012",
        email: "david@business.com",
        address: "654 Corporate Ave",
        company: "Brown Enterprises",
        jobTitle: "Director",
        contactSource: "networking",
        preferredContactMethod: "phone",
      },
    ];

    console.log("Adding sample customers...");

    for (const customer of sampleCustomers) {
      try {
        await databaseService.createCustomer(customer);
        console.log(`Added customer: ${customer.name}`);
      } catch (error) {
        console.log(
          `Skipped ${customer.name} (likely already exists):`,
          error.message
        );
      }
    }

    // Add some sample transactions to make customers have different spending amounts
    const customers = await databaseService.getCustomers();

    console.log("Adding sample transactions...");

    if (customers.length > 0) {
      // Add transactions for some customers
      await databaseService.createTransaction({
        customerId: customers[0].id,
        amount: 50000,
        description: "Website development",
        date: new Date().toISOString(),
        type: "sale",
      });

      await databaseService.createTransaction({
        customerId: customers[1].id,
        amount: 25000,
        description: "Consultation",
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        type: "sale",
      });

      await databaseService.createTransaction({
        customerId: customers[4].id,
        amount: 100000,
        description: "Large project",
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
        type: "sale",
      });
    }

    console.log("Sample data added successfully!");
    console.log("Total customers:", customers.length);
  } catch (error) {
    console.error("Failed to add sample customers:", error);
  } finally {
    await databaseService.closeDatabase();
  }
}

addSampleCustomers();
