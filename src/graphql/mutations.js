//graphql/mutations.js

import { gql ,useMutation} from '@apollo/client';


export const CREATE_USER = gql`
  mutation CreateUser($name: String!, $role: String!, $password: String!, $UniId: Int) {
    createUser(name: $name, role: $role, password: $password, UniId: $UniId) {
      id
      name
      role
      UniId
    }
  }
`;

export const LOGIN_USER= gql`
mutation Login($name: String!, $password: String!) {
    login(name: $name, password: $password) {
      token
      user {
        id
        name
        role
        UniId
      }
    }
  }
`;
export const CREATE_PROJECT = gql`
 mutation CreateNewProject($input: createProjectInput!) {
    createProject(input: $input) {
      id
      projectTitle
      projectDescription
      category
      startDate
      endDate
      projectStatus
      assignedStudents {
        id
        name
      }
      adminName
    }
  }
`;
export const GET_USERS = gql`
    query Users {
        users {
          id
        name
        role    # Include the role field
        }
    }
`;
