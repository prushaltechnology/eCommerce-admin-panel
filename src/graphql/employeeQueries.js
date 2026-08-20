import { gql } from '@apollo/client';

// ─── Employee Queries ─────────────────────────────────────────────────────────

export const GET_EMPLOYEES = gql`
  query GetEmployees($first: Int!, $search: String, $after: String) {
    employees(first: $first, search: $search, after: $after) {
      employees {
        id
        employeeId
        roleName
        isActive
        user {
          id
          firstName
          lastName
          email
          phone
        }
      }
      hasMore
      nextCursor
    }
  }
`;

// ─── Permission Queries ───────────────────────────────────────────────────────

export const GET_EMPLOYEE_PERMISSIONS = gql`
  query GetEmployeePermissions($employeeId: Int!) {
    employeePermissions(employeeId: $employeeId) {
      id
      module
      subModule
      access
    }
  }
`;


