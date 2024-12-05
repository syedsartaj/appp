import React, { useEffect, useState, useCallback } from 'react';
import Header from '../Components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [createUserModalVisible, setCreateUserModalVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('Admin');
  const [userPassword, setUserPassword] = useState('');

  // Fetch users from Firestore
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const ccode = await AsyncStorage.getItem('userCcode');
      if (!ccode) {
        Alert.alert('Error', 'Ccode is missing. Please login again.');
        return;
      }

      const q = query(collection(db, 'users'), where('ccode', '==', ccode));
      const querySnapshot = await getDocs(q);
      const usersData = [];
      querySnapshot.forEach((doc) => {
        usersData.push({ Id: doc.id, ...doc.data() });
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error.message);
      Alert.alert('Error', 'Unable to fetch user data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle user deletion
  const handleDelete = async (id) => {
    Alert.alert('Delete User', `Are you sure you want to delete this user?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', id));
            fetchData(); // Re-fetch users after deletion
          } catch (error) {
            console.error('Failed to delete user:', error.message);
            Alert.alert('Error', 'Failed to delete user.');
          }
        },
      },
    ]);
  };

  // Handle user editing
  const handleEdit = (user) => {
    setEditingUser(user);
    setUserName(user.Name);
    setUserRole(user.Role);
    setUserPassword(user.Password);
  };

  // Show create user modal
  const handleCreateUserModal = () => {
    setCreateUserModalVisible(true);
  };

  // Handle saving user (editing)
  const handleSave = async () => {
    if (!userName || !userPassword) {
      Alert.alert('Error', 'Name and Password are required.');
      return;
    }

    const userData = {
      Name: userName,
      Password: userPassword,
      Role: userRole,
    };

    try {
      await updateDoc(doc(db, 'users', editingUser.Id), userData);
      fetchData();
      setEditingUser(null);
      resetUserFields();
    } catch (error) {
      console.error('Failed to update user:', error.message);
      Alert.alert('Error', 'Failed to update user. Please try again.');
    }
  };

  // Handle creating a new user
  const handleCreateUser = async () => {
    if (!userName || !userPassword) {
      Alert.alert('Error', 'Name and Password are required.');
      return;
    }

    const userData = {
      Name: userName,
      Password: userPassword,
      Role: userRole,
      ccode: await AsyncStorage.getItem('userCcode'),
    };

    try {
      await addDoc(collection(db, 'users'), userData);
      Alert.alert('Success', 'User created successfully!');
      setCreateUserModalVisible(false);
      resetUserFields();
      fetchData();
    } catch (error) {
      console.error('Failed to create user:', error.message);
      Alert.alert('Error', 'Failed to create user. Please try again.');
    }
  };

  // Reset user fields
  const resetUserFields = () => {
    setUserName('');
    setUserRole('Admin');
    setUserPassword('');
  };

  // Fetch users on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      <Header />
      <View style={styles.header}>
        <Text style={styles.heading}>Sales Overview</Text>
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>Users</Text>
          <TouchableOpacity onPress={handleCreateUserModal} style={styles.createButton}>
            <Icon name="add-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Create User</Text>
          </TouchableOpacity>
        </View>

        {users.length === 0 ? (
  <Text style={styles.noDataText}>No users found.</Text>
) : (
  users.map(item => (
    <View key={item.Id} style={styles.userItem}>
      <View style={styles.userInfo}>
        {/* Displaying Document ID, Name, and Role */}
        <Text style={styles.userName}>ID: {item.Id}</Text>
        <Text style={styles.userName}>Name: {item.Name}</Text>
        <Text style={styles.userRole}>Role: {item.Role}</Text>
      </View>
      <View style={styles.iconContainer}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconButton}>
          <Icon name="create-outline" size={24} color="#1E2A5E" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.Id)} style={styles.iconButton}>
          <Icon name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  ))
)}

      </View>

      <UserModal
        visible={!!editingUser}
        onClose={() => setEditingUser(null)}
        userName={userName}
        userRole={userRole}
        userPassword={userPassword}
        setUserName={setUserName}
        setUserRole={setUserRole}
        setUserPassword={setUserPassword}
        onSave={handleSave}
      />

      <UserModal
        visible={createUserModalVisible}
        onClose={() => setCreateUserModalVisible(false)}
        userName={userName}
        userRole={userRole}
        userPassword={userPassword}
        setUserName={setUserName}
        setUserRole={setUserRole}
        setUserPassword={setUserPassword}
        onSave={handleCreateUser}
        isCreateMode
      />
    </ScrollView>
  );
};

const UserModal = ({ visible, onClose, userName, userRole, userPassword, setUserName, setUserRole, setUserPassword, onSave, isCreateMode }) => (
  <Modal transparent={true} visible={visible} onRequestClose={onClose}>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <TextInput
          placeholder="Name"
          placeholderTextColor="#555"
          value={userName}
          onChangeText={setUserName}
          style={styles.input}
        />
        <Picker
          selectedValue={userRole}
          onValueChange={setUserRole}
          style={styles.picker}
        >
          <Picker.Item label="Admin" value="Admin" />
          <Picker.Item label="Waiter" value="Waiter" />
          <Picker.Item label="Cashier" value="Cashier" />
          <Picker.Item label="Manager" value="Manager" />
        </Picker>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#555"
          value={userPassword}
          onChangeText={setUserPassword}
          secureTextEntry={true}
          style={styles.input}
        />
        <Pressable onPress={onSave} style={styles.saveButton}>
          <Text style={styles.buttonText}>{isCreateMode ? 'Create User' : 'Update User'}</Text>
        </Pressable>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.buttonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header:{
    flex:1,
    padding:10,
    backgroundColor: '#fff7e0',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff7e0',
  },
  heading: {
    color: '#1E2A5E',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#555',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userRole: {
    color: '#555',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  input: {
    color: '#555',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  picker: {
    color: '#555',
    height: 50,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
});

export default Dashboard;
