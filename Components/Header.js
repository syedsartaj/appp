import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';

const Header = () => {
  const [roles, setRoles] = useState([]);
  const [modalVisibles, setModalVisibles] = useState(false);
  const navigation = useNavigation();
  const roleBasedTabs = {
    Admin: ['Dashboard', 'Products', 'POS', 'Order', 'BillPayments','Stocks'],
    Manager: ['Dashboard', 'Products', 'Order', 'BillPayments','Stocks'],
    Cashier: ['Order', 'BillPayments'],
    Waiter: ['Order'],
  };
  const fetchUserRole = async () => {
    const storedRoleString = await AsyncStorage.getItem('userRole');
    if (storedRoleString) {
      const storedRole = JSON.parse(storedRoleString);
      const accessibleTabs = roleBasedTabs[storedRole]; // Default to an empty array if role is not found

      setRoles(accessibleTabs);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('userRole');
    navigation.navigate('LoginScreen');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DASHBOARD</Text>
        <TouchableOpacity style={styles.notificationButton}>
          {/* Add notification icon if needed */}
        </TouchableOpacity>
        <TouchableOpacity style={styles.profile} onPress={() => setModalVisibles(true)}>
          <Icon name="log-out-outline" size={24} color="#fff" />
          <Text style={styles.profileText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabs}>
    {roles.map((tab) => (
      <TouchableOpacity key={tab} style={styles.tab} onPress={() => navigation.navigate(tab)}>
        <Text style={styles.tabText}>{tab.toUpperCase()}</Text>
      </TouchableOpacity>
    ))}
  </View>

      {/* Modal for logout confirmation */}
      <Modal
        transparent={true}
        visible={modalVisibles}
        animationType="slide"
        onRequestClose={() => setModalVisibles(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisibles(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={logout}>
                <Text style={styles.modalButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1E2A5E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  notificationButton: {
    position: 'relative',
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 5,
  },
  tabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#fff7e0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  tab: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#fff7e0',
  },
  tabText: {
    fontSize: 14,
    color: '#1E2A5E',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E2A5E',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1E2A5E',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E2A5E',
  },
});

export default Header;
