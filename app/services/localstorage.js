import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const userIdKey = 'user_id';
const usernameKey = 'user_name';

export function getUserId() {
  var id = localStorage.getItem(userIdKey);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(userIdKey, id);
  }
  return id;
}

export function getUsername() {
  return localStorage.getItem(usernameKey) ?? 'NONAME';
}

export function useUserId() {
  const [uid, setUid] = useState('');
  useEffect(() => {
    setUid(getUserId());
  }, []);

  return uid;
}

export function useUsername() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const name = localStorage.getItem(usernameKey);

    if (!username && name != null) {
      setUsername(name);
    }

    if (username && name != username) {
      setUsername(username);
      localStorage.setItem(usernameKey, username);
    }
  }, [username]);

  return [username, setUsername];
}
