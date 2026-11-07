import { hasStaffSession } from "@/lib/auth";
import StaffDashboard from "@/components/staff/StaffDashboard";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  return <StaffDashboard initiallyAuthenticated={await hasStaffSession()} />;
}
