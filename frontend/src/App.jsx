import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { getCookie, setCookie } from './utils/cookies';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = getCookie('auth_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (token) => {
    setCookie('auth_token', token, 7);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCookie('auth_token', '', 0);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Switch>
        <Route exact path="/login">
          {isAuthenticated ? <Redirect to="/" /> : <Login onLogin={handleLogin} />}
        </Route>
        <Route path="/">
          {isAuthenticated ? (
            <Dashboard onLogout={handleLogout} />
          ) : (
            <Redirect to="/login" />
          )}
        </Route>
      </Switch>
    </Router>
  );
};

export default App;