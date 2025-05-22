// schema.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    role: String!
    UniId: Int
    projects: [Project!]! 
    tasks: [Task!]!       
  }



 type Project {
  id: ID!
  projectTitle: String!
  projectDescription: String!
  category: String!
  startDate: String!
  endDate: String!
  projectStatus: String!
  assignedStudents: [User!]!
  adminName: String!
  tasks: [Task!]!  
}


 input createProjectInput {
  projectTitle: String!
  projectDescription: String!
  category: String!
  startDate: String!
  endDate: String!
  projectStatus: String!
  assignedStudents: [ID!]! 
  adminName: String!
}

  enum ProjectStatus{
    PENDING
    IN_PROGRESS
    COMPLETED
    ON_HOLD
    CANCELLED
  }


enum UserRole {
  STUDENT
  ADMIN
}



type SentMessageResponse {

  message: String!
  sentMessage: ChatMessage
}

type ChatMessage {
    id: ID!
    sender: User!
    receiver: User!
    message: String!
    timestamp: String!
  }



  type Query {
    users: [User!]!
    user(id: ID,name: String): User
    projects: [Project!]!
    project(id: ID!): Project
    tasks: [Task!]!
    task(id: ID!): Task
    numberOfStudents: Int!
    numberOfProjects:Int!
    numberOfTasks:Int!
    numberOfFinishedProjects:Int!
    projectsByAdmin(adminName: String!): [Project!]!
    messages(senderId: ID!, receiverId: ID!): [ChatMessage!]!
    admins: [User!]! 
    receivedMessages(receiverId: ID!): [ChatMessage!]! 
    adminTasks(adminId: ID!): [Task!]!
    tasksByAdmin(adminName: String!): [Task!]!
  }



type Task{
id: ID!
    taskName: String!
    description: String
    status: String!
    dueDate: String!
    projectTitle: Project!
    assignedStudents: [User!]!
}


  type Mutation {
 
  sendMessage(senderId: ID!, receiverId: ID!, message: String!): SentMessageResponse!
  createProject(input: createProjectInput!): Project!
  
  createUser(
      name: String!
      role: String!
      password: String! 
      UniId: Int
    ): User!
  

    createTask(
    projectTitle:ID!
    taskName:String!
    description:String!
    assignedStudents:[ID!]!
    status: String!
    dueDate:String!
   ): Task!


  }





  type AuthPayload {
    token: String!
    user: User!
  }

  extend type Mutation {
    login(name: String!, password: String!): AuthPayload!
  }
`;

module.exports = typeDefs;
