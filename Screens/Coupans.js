import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import axios from 'axios';
import SQLite from 'react-native-sqlite-storage';
import Header from '../Components/Header';
import Icon from 'react-native-vector-icons/FontAwesome';
import { debounce } from 'lodash';

const db = SQLite.openDatabase({ name: 'coupons.db', location: 'default' });

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [name, setName] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [per, setPer] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    createTables();
    fetchCouponsFromAPI();
  }, []);

  const createTables = useCallback(() => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS Coupons (id INTEGER PRIMARY KEY AUTOINCREMENT, Name TEXT, DiscountValue REAL, Tages TEXT)',
        [],
        () => console.log('Coupons table created successfully'),
        (tx, error) => console.error('Error creating Coupons table: ', error.message)
      );
    });
  }, []);

  const fetchCouponsFromAPI = useCallback(
    debounce(async () => {
      try {
        const response = await axios.get('https://sartaj.azurewebsites.net/api/coupons');
        const coupons = response.data;
        setCoupons(coupons);
        insertCouponsIntoDB(coupons);
      } catch (error) {
        Alert.alert('Error', 'Unable to fetch coupons from the server. Loading offline data...');
        fetchCouponsFromDB();
      }
    }, 500),
    []
  );

  const insertCouponsIntoDB = useCallback(coupons => {
    db.transaction(tx => {
      tx.executeSql('DELETE FROM Coupons', [], () => {
        const query = 'INSERT INTO Coupons (Name, DiscountValue, Tages) VALUES (?, ?, ?)';
        coupons.forEach(coupon => {
          tx.executeSql(
            query,
            [coupon.Name, coupon.DiscountValue, coupon.Tages],
            () => console.log(`Inserted coupon: ${coupon.Name}`),
            (tx, error) => console.error('Error inserting coupon: ', error.message)
          );
        });
      });
    });
  }, []);

  const fetchCouponsFromDB = useCallback(() => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM Coupons',
        [],
        (tx, results) => {
          const coupons = [];
          for (let i = 0; i < results.rows.length; i++) {
            coupons.push(results.rows.item(i));
          }
          setCoupons(coupons);
        },
        (tx, error) => Alert.alert('Error', 'Unable to load coupons from the local database.')
      );
    });
  }, []);

  const handleAddOrUpdate = useCallback(async () => {
    const couponData = {
      Name: name,
      DiscountValue: parseFloat(discountValue),
      Tages: per,
    };

    try {
      if (editingId) {
        await axios.put(`https://sartaj.azurewebsites.net/api/coupons/${editingId}`, couponData);
        Alert.alert('Success', 'Coupon updated successfully!');
      } else {
        await axios.post('https://sartaj.azurewebsites.net/api/coupons', couponData);
        Alert.alert('Success', 'Coupon created successfully!');
      }
      resetForm();
      fetchCouponsFromAPI();
      setModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while saving the coupon.');
    }
  }, [name, discountValue, per, editingId, fetchCouponsFromAPI]);

  const handleEdit = useCallback(coupon => {
    setName(coupon.Name);
    setDiscountValue(coupon.DiscountValue.toString());
    setPer(coupon.Tages);
    setEditingId(coupon.ID);
    setModalVisible(true);
  }, []);

  const handleDelete = useCallback(async id => {
    try {
      await axios.delete(`https://sartaj.azurewebsites.net/api/coupons/${id}`);
      Alert.alert('Success', 'Coupon deleted successfully!');
      fetchCouponsFromAPI();
    } catch (error) {
      Alert.alert('Error', 'Unable to delete coupon from the server.');
    }
  }, [fetchCouponsFromAPI]);

  const resetForm = useCallback(() => {
    setName('');
    setDiscountValue('');
    setPer('');
    setEditingId(null);
  }, []);

  const renderCouponItem = useCallback(({ item }) => (
    <CouponItem
      key={item.ID}
      coupon={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ), [handleEdit, handleDelete]);

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Coupons</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.button}>
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.buttonText}> Add Coupon</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={coupons}
        keyExtractor={item => item.ID.toString()}
        renderItem={renderCouponItem}
        initialNumToRender={10}
        contentContainerStyle={coupons.length === 0 ? styles.emptyList : null}
      />

      <CouponModal
        isVisible={isModalVisible}
        onClose={() => {
          setModalVisible(false);
          resetForm();
        }}
        onAddOrUpdate={handleAddOrUpdate}
        name={name}
        discountValue={discountValue}
        per={per}
        setName={setName}
        setDiscountValue={setDiscountValue}
        setPer={setPer}
      />
    </View>
  );
};

const CouponItem = React.memo(({ coupon, onEdit, onDelete }) => (
  <View style={styles.couponItem}>
    <Text style={styles.textdata}>
      {coupon.Name} - {coupon.DiscountValue} ({coupon.Tages})
    </Text>
    <View style={styles.actions}>
      <TouchableOpacity onPress={() => onEdit(coupon)} style={styles.editButton}>
        <Icon name="edit" size={20} color="#1E2A5E" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(coupon.ID)} style={styles.deleteButton}>
        <Icon name="trash" size={20} color="red" />
      </TouchableOpacity>
    </View>
  </View>
));

const CouponModal = ({ isVisible, onClose, onAddOrUpdate, name, discountValue, per, setName, setDiscountValue, setPer }) => (
  <Modal
    animationType="slide"
    transparent
    visible={isVisible}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Create Coupon</Text>
        <TextInput
          placeholder="Coupon Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Discount Value"
          value={discountValue}
          onChangeText={setDiscountValue}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Type (percentage/fixed)"
          value={per}
          onChangeText={setPer}
          style={styles.input}
        />
        <TouchableOpacity onPress={onAddOrUpdate} style={styles.button}>
          <Text style={styles.buttonText}>Save Coupon</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff7e0',
    flex: 1, // Allow the container to grow and fill the available space
  },
  closeText: {
    textAlign: 'center',
    color: '#1E2A5E',
  },
  headerRow: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#555',
  },
  textdata: {
    color: '#1E2A5E',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    color: '#1E2A5E',
  },
  button: {
    backgroundColor: '#1E2A5E',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
  },
  couponItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 5,
    elevation: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: Dimensions.get('window').width - 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default Coupons;
