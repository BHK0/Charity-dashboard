import { Suspense } from 'react';
import { getAllUsers } from '@/app/actions/users';
import UserManagementClient from './_components/UserManagementClient';

async function UserManagement() {
  // Fetch users server-side
  const users = await getAllUsers();

  return (
    <Suspense fallback={
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      <UserManagementClient initialUsers={users} />
    </Suspense>
  );
}

export default UserManagement;
