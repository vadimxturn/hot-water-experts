import Link from "next/link";
import { getDb } from "@/lib/store";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const db = await getDb();
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Customers</h1>
      <p className="mb-4 text-sm text-[#71717a]">Sample customers. They do not get a login. They use the tracking link.</p>
      <div className="overflow-hidden rounded-[10px] border border-[#e9e9ec] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f4f4f5] text-xs text-[#71717a]">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Phone</th><th className="px-3 py-2">City</th><th className="px-3 py-2">Jobs</th><th className="px-3 py-2">Texts</th></tr>
          </thead>
          <tbody>
            {db.customers.map((customer) => {
              const property = db.properties.find((row) => row.customerId === customer.id);
              const jobs = db.jobs.filter((row) => row.customerId === customer.id);
              return (
                <tr key={customer.id} className="border-t border-[#f4f4f5]">
                  <td className="px-3 py-2"><Link href={`/admin/customers/${customer.id}`} className="font-medium">{customer.name}</Link></td>
                  <td className="px-3 py-2">{customer.phone}</td>
                  <td className="px-3 py-2">{property?.city}</td>
                  <td className="px-3 py-2">{jobs.length}</td>
                  <td className="px-3 py-2">{customer.smsOptIn ? "Opted in" : "No SMS consent"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
