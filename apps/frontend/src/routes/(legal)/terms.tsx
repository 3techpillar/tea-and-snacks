import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(legal)/terms")({
  head: () => ({
    meta: [{ title: "Terms & Conditions — Tea & Snacks" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="prose prose-slate mx-auto max-w-none dark:prose-invert">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Terms and Conditions
        </h1>
        
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="mt-8 space-y-8 text-foreground/80">
          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              Welcome to Tea & Snacks. By accessing our platform, ordering food, or using our services, you agree to be bound by these Terms and Conditions. Please read them carefully before placing an order.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">2. Ordering and Payment</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>All orders placed through our platform are subject to availability and acceptance by the respective vendor.</li>
              <li>Payments must be completed successfully before an order is confirmed. We accept UPI and other designated online payment methods.</li>
              <li>Prices are subject to change without prior notice, but you will always be charged the price listed at the time of checkout.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">3. Cancellations and Refunds</h2>
            <p className="mb-2">
              Order cancellations are generally not permitted once a vendor has started preparing your food (status: "Preparing"). 
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>If an order is rejected or cancelled by the vendor, a full refund will be initiated to your original payment method.</li>
              <li>Refunds may take 5-7 business days to reflect in your bank account depending on your payment provider.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">4. Food Quality and Allergies</h2>
            <p>
              While we strive to ensure the highest quality standards, the preparation and quality of the food are the sole responsibility of the individual vendor. If you have any food allergies or special dietary requirements, it is your responsibility to contact the vendor directly or indicate this clearly before placing your order. We do not guarantee that any food is allergen-free.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">5. Platform Usage</h2>
            <p>
              You agree to use this platform only for lawful purposes. You must not attempt to manipulate the ordering system, use automated scripts to place orders, or engage in any fraudulent activity. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding these terms or your order, please contact our support team.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
