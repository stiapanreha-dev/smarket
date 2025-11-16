import { useState } from 'react';
import { Container, Table, Button, Badge, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaSearch } from 'react-icons/fa';
import { getUsers, updateUserRole, UserRole } from '@/api/admin.api';
import type { User } from '@/api/admin.api';
import { Navbar, Footer } from '@/components/layout';

export function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch users
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', { search, roleFilter, page, limit }],
    queryFn: () => getUsers({
      search: search || undefined,
      role: roleFilter || undefined,
      page,
      limit,
    }),
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      updateUserRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const colors = {
      [UserRole.ADMIN]: 'danger',
      [UserRole.MERCHANT]: 'primary',
      [UserRole.BUYER]: 'secondary',
    };
    return <Badge bg={colors[role]}>{role}</Badge>;
  };

  return (
    <>
      <Navbar />
      <Container className="py-4">
        <h1 className="mb-4">User Management</h1>

        {/* Filters */}
        <div className="mb-4">
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>

          <Form.Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
            style={{ maxWidth: '200px' }}
          >
            <option value="">All Roles</option>
            <option value={UserRole.BUYER}>Buyer</option>
            <option value={UserRole.MERCHANT}>Merchant</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </Form.Select>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="alert alert-danger">
            <h4>Error loading users</h4>
            <p>{error instanceof Error ? error.message : 'Failed to load users. Please make sure you are logged in as admin.'}</p>
            <p>Try logging out and logging back in.</p>
          </div>
        ) : data && data.data.length > 0 ? (
          <>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user: User) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.first_name} {user.last_name}</td>
                    <td>{user.phone || '-'}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      {user.email_verified ? (
                        <Badge bg="success">Yes</Badge>
                      ) : (
                        <Badge bg="warning">No</Badge>
                      )}
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <Dropdown>
                        <Dropdown.Toggle variant="secondary" size="sm">
                          Change Role
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() => handleRoleChange(user.id, UserRole.BUYER)}
                            disabled={user.role === UserRole.BUYER}
                          >
                            Set as Buyer
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleRoleChange(user.id, UserRole.MERCHANT)}
                            disabled={user.role === UserRole.MERCHANT}
                          >
                            Set as Merchant
                          </Dropdown.Item>
                          <Dropdown.Item
                            onClick={() => handleRoleChange(user.id, UserRole.ADMIN)}
                            disabled={user.role === UserRole.ADMIN}
                          >
                            Set as Admin
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {/* Pagination */}
            {data.pagination.pages > 1 && (
              <div className="d-flex justify-content-center gap-2">
                <Button
                  variant="outline-primary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="align-self-center">
                  Page {page} of {data.pagination.pages}
                </span>
                <Button
                  variant="outline-primary"
                  disabled={page === data.pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-5">
            <p>No users found</p>
          </div>
        )}
      </Container>
      <Footer />
    </>
  );
}

export default UsersPage;
