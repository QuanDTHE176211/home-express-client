export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">
        These terms outline the acceptable use of the Home Express platform. By using the service,
        you agree to follow our policies, respect other users, and comply with applicable laws.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Key points</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Keep your account credentials secure and do not share them.</li>
          <li>Provide accurate information for bookings, payments, and identity verification.</li>
          <li>Use the platform only for lawful transport and booking activities.</li>
          <li>We may update these terms; continued use means you accept the changes.</li>
        </ul>
      </section>
      <p className="text-muted-foreground">
        For full details or questions, contact support@homeexpress.vn. If you disagree with these
        terms, please stop using the service.
      </p>
    </main>
  )
}
