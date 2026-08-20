import { gql } from '@apollo/client';

// ─── Employee Mutations ───────────────────────────────────────────────────────

export const CREATE_EMPLOYEE = gql`
  mutation CreateEmployee(
    $email: String!
    $password: String!
    $firstName: String!
    $lastName: String!
    $phone: String!
    $employeeRoleName: String!
  ) {
    adminCreateEmployee(
      email: $email
      password: $password
      firstName: $firstName
      lastName: $lastName
      phone: $phone
      employeeRoleName: $employeeRoleName
    ) {
      employee {
        id
        employeeId
        roleName
        isActive
        user {
          id
          email
          firstName
          lastName
          phone
        }
      }
    }
  }
`;

export const UPDATE_EMPLOYEE = gql`
  mutation UpdateEmployee(
    $id: ID!
    $firstName: String
    $lastName: String
    $phone: String
    $roleName: String
    $isActive: Boolean
  ) {
    updateEmployee(
      id: $id
      firstName: $firstName
      lastName: $lastName
      phone: $phone
      roleName: $roleName
      isActive: $isActive
    ) {
      employee {
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
    }
  }
`;

export const DELETE_EMPLOYEE = gql`
  mutation DeleteEmployee($id: ID!) {
    deleteEmployee(id: $id) {
      ok
    }
  }
`;

// ─── Permission Mutations ─────────────────────────────────────────────────────

export const CREATE_EMPLOYEE_PERMISSION = gql`
  mutation CreateEmployeePermission(
    $employeeId: Int!
    $module: String!
    $access: String!
    $subModule: String
  ) {
    createEmployeePermission(
      employeeId: $employeeId
      module: $module
      access: $access
      subModule: $subModule
    ) {
      permission {
        id
        module
        subModule
        access
        employee {
          employeeId
        }
      }
    }
  }
`;

export const UPDATE_EMPLOYEE_PERMISSION = gql`
  mutation UpdateEmployeePermission(
    $id: Int!
    $access: String!
    $subModule: String
  ) {
    updateEmployeePermission(
      id: $id
      access: $access
      subModule: $subModule
    ) {
      permission {
        id
        module
        subModule
        access
      }
    }
  }
`;

export const DELETE_EMPLOYEE_PERMISSION = gql`
  mutation DeleteEmployeePermission($id: Int!) {
    deleteEmployeePermission(id: $id) {
      success
    }
  }
`;