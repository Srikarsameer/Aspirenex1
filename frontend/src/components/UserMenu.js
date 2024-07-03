import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Menu, Dropdown } from 'antd';
// import { DownOutlined } from '@ant-design/icons';

const UserMenu = ({ user }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menu = (
    <Menu>
      <Menu.Item key="1">
        <span>Name: {user?.name}</span>
      </Menu.Item>
      <Menu.Item key="2">
        <span>Email: {user?.email}</span>
      </Menu.Item>
      <Menu.Item key="3" onClick={handleLogout}>
        <span>Logout</span>
      </Menu.Item>
    </Menu>
  );

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <Dropdown overlay={menu} trigger={['click']} onVisibleChange={(flag) => setVisible(flag)} visible={visible}>
      <div className="user-menu-icon" onClick={(e) => e.preventDefault()}>
        <div className="initials">{initials}</div>
        <span>Role : {user?.isAdmin ? "Admin" : "User"}</span>

      </div>
    </Dropdown>
  );
};

export default UserMenu;
