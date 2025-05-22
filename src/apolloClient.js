import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:4000/', // or your deployed URL
  cache: new InMemoryCache(),
});

export default client;
