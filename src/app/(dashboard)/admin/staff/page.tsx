'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useUsers,
  useCreateUser,
  useDisableUser,
  useEnableUser,
} from '@/hooks/use-admin';
import { CreateUserSchema, type CreateUserDto } from '@/schemas/user.schema';
import { EmptyState } from '@/components/empty-state';

export default function StaffPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: usersData, isLoading } = useUsers();
  const users = usersData?.data?.data || usersData?.data || [];

  const createUser = useCreateUser();
  const disableUser = useDisableUser();
  const enableUser = useEnableUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserDto>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { role: 'staff' },
  });

  const onCreateSubmit = async (data: CreateUserDto) => {
    try {
      await createUser.mutateAsync(data);
      toast.success(`Staff account created for ${data.name}`);
      reset();
      setIsCreateOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || 'Failed to create staff',
      );
    }
  };

  const handleDisable = async (userId: string, name: string) => {
    try {
      await disableUser.mutateAsync(userId);
      toast.success(`${name} has been disabled`);
    } catch {
      toast.error('Failed to disable user');
    }
  };

  const handleEnable = async (userId: string, name: string) => {
    try {
      await enableUser.mutateAsync(userId);
      toast.success(`${name} has been re-enabled`);
    } catch {
      toast.error('Failed to enable user');
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage staff accounts and permissions
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              + Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Staff Account</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onCreateSubmit)}
              className="space-y-4"
            >
              <div>
                <Label>Name</Label>
                <Input {...register('name')} placeholder="Jane Smith" />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="jane@uniwayin.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  defaultValue="staff"
                  onValueChange={(v) => setValue('role', v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))
      ) : users.length === 0 ? (
        <EmptyState
          icon="👤"
          title="No staff yet"
          description="Add staff accounts to give your team access."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Last Login
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user: any) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{user.email}</td>
                    <td className="px-4 py-3 capitalize">{user.role}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={user.isActive ? 'default' : 'secondary'}
                        className={
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }
                      >
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {user.lastLoginAt
                        ? format(new Date(user.lastLoginAt), 'MMM d, h:mm a')
                        : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-red-600">Disable</Button>} />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Disable {user.name}?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                They will immediately lose access to the system.
                                Their leads and activity history will remain
                                unchanged. You can re-enable them later.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDisable(user._id, user.name)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Disable
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600"
                          onClick={() => handleEnable(user._id, user.name)}
                        >
                          Enable
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
