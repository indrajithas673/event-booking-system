import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import * as adminService from '../../services/adminService';
import RoleBadge from '../../components/ui/RoleBadge';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';

const ROLE_OPTIONS = [
  { key: 'all', label: 'All Roles' },
  { key: 'attendee', label: 'Attendee' },
  { key: 'organizer', label: 'Organizer' },
  { key: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { key: 'all', label: 'All Status' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const LIMIT = 10;

const AdminUsersPage = () => {
  useDocumentTitle('Manage Users');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearch = useDebounce(search, 400);

  const { page, nextPage, prevPage, goToPage, hasNextPage, hasPrevPage } =
    usePagination(totalPages);

  const [actionLoading, setActionLoading] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const dropdownRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: LIMIT };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.active = statusFilter === 'active';

      const response = await adminService.getUsers(params);
      const data = response.data || response;
      setUsers(data.users || (Array.isArray(data) ? data : []));
      setTotalPages(data.pagination?.pages || data.totalPages || 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    goToPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleChangeRole = async () => {
    if (!roleModal || !selectedRole) return;
    setActionLoading(roleModal._id);
    try {
      await adminService.updateUserRole(roleModal._id, { role: selectedRole });
      toast.success(`Role updated to ${selectedRole}`);
      setRoleModal(null);
      setSelectedRole('');
      await fetchUsers();
    } catch {
      toast.error('Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleActive = async (user) => {
    setActionLoading(user._id);
    setOpenDropdown(null);
    try {
      await adminService.toggleUserActive(user._id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      await fetchUsers();
    } catch {
      toast.error('Failed to toggle user status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal) return;
    setActionLoading(deleteModal._id);
    try {
      await adminService.deleteUser(deleteModal._id);
      toast.success('User deleted successfully');
      setDeleteModal(null);
      setDeleteConfirmEmail('');
      await fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const openRoleModal = (user) => {
    setOpenDropdown(null);
    setSelectedRole(user.role);
    setRoleModal(user);
  };

  const openDeleteModal = (user) => {
    setOpenDropdown(null);
    setDeleteConfirmEmail('');
    setDeleteModal(user);
  };

  const getAvatarUrl = (user) => {
    if (user.avatar || user.profileImage) return user.avatar || user.profileImage;
    return null;
  };

  const getUserStat = (user) => {
    if (user.role === 'organizer') return { label: 'Events', value: user.eventCount ?? user.eventsCount ?? 0 };
    return { label: 'Registrations', value: user.registrationCount ?? user.registrationsCount ?? 0 };
  };

  return (
    <div className="space-y-6">
      {/* ═══════ Header ═══════ */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">View and manage all platform users</p>
      </div>

      {/* ═══════ Search & Filters ═══════ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800
                       border border-gray-300 dark:border-gray-600 rounded-lg
                       focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                       placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
                     border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800
                     border border-gray-300 dark:border-gray-600 rounded-lg
                     focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ═══════ Content ═══════ */}
      {loading ? (
        <TableSkeleton />
      ) : users.length === 0 ? (
        <EmptyState search={debouncedSearch} />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-visible">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => {
                  const avatar = getAvatarUrl(user);
                  const stat = getUserStat(user);

                  return (
                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {avatar ? (
                            <img src={avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                                {(user.name || '?')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span className={`w-2 h-2 rounded-full ${
                            user.isActive !== false ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                          <span className={user.isActive !== false
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                          }>
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {stat.value} <span className="text-gray-400 dark:text-gray-500">{stat.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <UserActionsDropdown
                          user={user}
                          isOpen={openDropdown === user._id}
                          onToggle={() => setOpenDropdown(openDropdown === user._id ? null : user._id)}
                          onChangeRole={() => openRoleModal(user)}
                          onToggleActive={() => handleToggleActive(user)}
                          onDelete={() => openDeleteModal(user)}
                          isLoading={actionLoading === user._id}
                          dropdownRef={openDropdown === user._id ? dropdownRef : null}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {users.map((user) => (
              <MobileUserCard
                key={user._id}
                user={user}
                isOpen={openDropdown === user._id}
                onToggle={() => setOpenDropdown(openDropdown === user._id ? null : user._id)}
                onChangeRole={() => openRoleModal(user)}
                onToggleActive={() => handleToggleActive(user)}
                onDelete={() => openDeleteModal(user)}
                isLoading={actionLoading === user._id}
                dropdownRef={openDropdown === user._id ? dropdownRef : null}
                getAvatarUrl={getAvatarUrl}
                getUserStat={getUserStat}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <PaginationBar page={page} totalPages={totalPages} prevPage={prevPage} nextPage={nextPage}
              goToPage={goToPage} hasPrevPage={hasPrevPage} hasNextPage={hasNextPage} />
          )}
        </>
      )}

      {/* ═══════ Change Role Modal ═══════ */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !actionLoading && setRoleModal(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mt-4">Change User Role</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
              Update role for <span className="font-semibold text-gray-900 dark:text-white">{roleModal.name}</span>
            </p>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full mt-4 px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700
                         border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="attendee">Attendee</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRoleModal(null)}
                disabled={actionLoading === roleModal._id}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300
                           bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                           rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeRole}
                disabled={actionLoading === roleModal._id || selectedRole === roleModal.role}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors
                           disabled:opacity-50 flex items-center justify-center gap-2
                           bg-primary-600 hover:bg-primary-700"
              >
                {actionLoading === roleModal._id && <LoadingSpinner />}
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Delete User Modal ═══════ */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !actionLoading && setDeleteModal(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mt-4">Delete User</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 leading-relaxed">
              This action is <span className="font-bold text-red-600 dark:text-red-400">irreversible</span>.
              All data for <span className="font-semibold text-gray-900 dark:text-white">{deleteModal.name}</span> will be permanently removed.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3">
              Type <span className="font-mono font-bold text-gray-900 dark:text-white">{deleteModal.email}</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder="Type email to confirm..."
              className="w-full mt-3 px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700
                         border border-gray-300 dark:border-gray-600 rounded-lg
                         focus:ring-2 focus:ring-red-500 focus:border-red-500
                         placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={actionLoading === deleteModal._id}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300
                           bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                           rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading === deleteModal._id || deleteConfirmEmail !== deleteModal.email}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors
                           disabled:opacity-50 flex items-center justify-center gap-2
                           bg-red-600 hover:bg-red-700"
              >
                {actionLoading === deleteModal._id && <LoadingSpinner />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════ User Actions Dropdown ═══════ */
const UserActionsDropdown = ({ user, isOpen, onToggle, onChangeRole, onToggleActive, onDelete, isLoading, dropdownRef }) => (
  <div className="relative inline-block" ref={dropdownRef}>
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      disabled={isLoading}
      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
      aria-label="User actions"
    >
      {isLoading ? <LoadingSpinner /> : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
        </svg>
      )}
    </button>

    {isOpen && (
      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg
                      border border-gray-200 dark:border-gray-700 py-1 z-50">
        <button
          onClick={onChangeRole}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium
                     text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          Change Role
        </button>
        <button
          onClick={onToggleActive}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium
                     text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
          </svg>
          {user.isActive !== false ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium
                     text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          Delete User
        </button>
      </div>
    )}
  </div>
);

/* ═══════ Mobile User Card ═══════ */
const MobileUserCard = ({ user, isOpen, onToggle, onChangeRole, onToggleActive, onDelete, isLoading, dropdownRef, getAvatarUrl, getUserStat }) => {
  const avatar = getAvatarUrl(user);
  const stat = getUserStat(user);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {avatar ? (
            <img src={avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {(user.name || '?')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <UserActionsDropdown
          user={user} isOpen={isOpen} onToggle={onToggle}
          onChangeRole={onChangeRole} onToggleActive={onToggleActive}
          onDelete={onDelete} isLoading={isLoading} dropdownRef={dropdownRef}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <RoleBadge role={user.role} />
        <span className="inline-flex items-center gap-1.5 text-xs">
          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-green-500' : 'bg-gray-400'}`} />
          {user.isActive !== false ? 'Active' : 'Inactive'}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {stat.value} {stat.label}
        </span>
      </div>
    </div>
  );
};

/* ═══════ Pagination ═══════ */
const PaginationBar = ({ page, totalPages, prevPage, nextPage, goToPage, hasPrevPage, hasNextPage }) => (
  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-3.5">
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Page <span className="font-semibold text-gray-900 dark:text-white">{page}</span> of{' '}
      <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
    </p>
    <div className="flex items-center gap-2">
      <button
        onClick={prevPage}
        disabled={!hasPrevPage}
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                   hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce((acc, p, i, arr) => {
          if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
          acc.push(p);
          return acc;
        }, [])
        .map((item, i) =>
          item === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-gray-400 dark:text-gray-500">...</span>
          ) : (
            <button
              key={item}
              onClick={() => goToPage(item)}
              className={`w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                page === item
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item}
            </button>
          )
        )}

      <button
        onClick={nextPage}
        disabled={!hasNextPage}
        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                   hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  </div>
);

/* ═══════ Loading Spinner ═══════ */
const LoadingSpinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/* ═══════ Empty State ═══════ */
const EmptyState = ({ search }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
      {search ? 'No results found' : 'No users yet'}
    </h3>
    <p className="text-gray-500 dark:text-gray-400">
      {search ? `No users matching "${search}".` : 'No users have registered on the platform yet.'}
    </p>
  </div>
);

/* ═══════ Table Skeleton ═══════ */
const TableSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
    <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-3.5">
      <div className="flex gap-6">
        {[160, 80, 80, 100, 100, 60].map((w, i) => (
          <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: w }} />
        ))}
      </div>
    </div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-6 px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-3 w-[200px]">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        </div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" />
      </div>
    ))}
  </div>
);

export default AdminUsersPage;
