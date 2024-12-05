import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Header from '../Components/Header';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Pressable
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, where, doc, updateDoc, addDoc,getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust path to your Firebase config

const Order = () => {
  const screenWidth = Dimensions.get('window').width;
  const [searchQuery, setSearchQuery] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [products, setProducts] = useState([]);
  const [Stock, setStock] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [orderedFood, setOrderedFood] = useState([]);
  const [orderedFoodIngredents, setOrderedFoodIngredents] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState(['All', 'Beverages', 'Snacks', 'Main Course']);
  const [tableNo, setTableNo] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      const fetchProductsOnFocus = async () => {
        setLoading(true);
        try {
          const code = await AsyncStorage.getItem('userCcode');
          
          // Fetch Products
          const productsRef = collection(db, 'products');
          const productsQuery = query(productsRef, where('ccode', '==', code));
          const productSnapshots = await getDocs(productsQuery);
          const productsData = productSnapshots.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            ingredients: doc.data().ingredients || [],
          }));
          setProducts(productsData);
          setFilteredProducts(productsData);
    
          // Fetch Stock
          const stockRef = collection(db, 'stocks');
          const stockQuery = query(stockRef, where('ccode', '==', code));
          const stockSnapshots = await getDocs(stockQuery);
          const stockData = stockSnapshots.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setStock(stockData);
        } catch (error) {
          console.error('Error fetching products or stock:', error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchProductsOnFocus();
    }, [])
  );

  useEffect(() => {
    filterProducts();
  }, [searchQuery, productCategory, products]);


  const filterProducts = () => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (productCategory && productCategory !== 'All') {
      filtered = filtered.filter((product) => product.category === productCategory);
    }

    setFilteredProducts(filtered);
  };

  const handlePress = (item) => {
    setOrderedFood([...orderedFood, item]);
    setTotalAmount((prevTotal) => prevTotal + item.price);
  
    // Check if ingredients are already an array; if so, use directly
    const ingredients = typeof item.ingredients === 'string' 
      ? JSON.parse(item.ingredients) 
      : item.ingredients;
  
    setOrderedFoodIngredents([...orderedFoodIngredents, ingredients]);
  };
  
  const handleRemove = (index) => {
    const newOrderedFood = [...orderedFood];
    const removedItem = newOrderedFood.splice(index, 1)[0];
    setOrderedFood(newOrderedFood);
    setTotalAmount((prevTotal) => prevTotal - removedItem.price);
    const newfoodIngredents = [...orderedFoodIngredents];
    newfoodIngredents.splice(index, 1);
    setOrderedFoodIngredents(newfoodIngredents);
  };

  const printOrder = async () => {
    if (!tableNo) {
      alert('Please enter a table number.');
      return;
    }

    const ingredients = orderedFoodIngredents.flat();
    const ingredientList = ingredients.map(({ name, quantity,id }) => ({ name, quantity,id }));
    const code = await AsyncStorage.getItem('userCcode');

    const orderDetails = {
      TableNo: parseInt(tableNo, 10),
      BA: parseFloat(totalAmount).toFixed(2),
      Items: JSON.stringify(orderedFood),
      Confirmed: 'yes',
      ccode: code,
    };

    try {
      // Add Order to Firestore
      await addDoc(collection(db, 'orders'), orderDetails);
      alert('Order submitted successfully!');
      await updateStock(ingredientList);
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error submitting order. Please try again.');
    } finally {
      setLoading(false);
      setSearchQuery('');
      setOrderedFood([]);
      setOrderedFoodIngredents([]);
      setTotalAmount(0);
      setTableNo('');
    }
  };

  const updateStock = async (ingredientList) => {
    try {
      const code = await AsyncStorage.getItem('userCcode');
  
      await Promise.all(
        ingredientList.map(async ({ id, name, quantity }) => {
          console.log(`Checking stock for ID: ${id}, ccode: ${code}`);
          const stockDocRef = doc(db, 'stock',id);          
          // Fetch the document
          const stockDocSnap = await getDoc(stockDocRef);
          
          // Check if the document exists
          if (!stockDocSnap.exists()) {
            console.error(`Stock item with id ${id} not found.`);
          } else {
            // Document exists, proceed with updating the stock
            const stockData = stockDocSnap.data();
            const updatedQuantity = stockData.quantity - quantity;
  
            // Update the stock quantity
            await updateDoc(stockDocRef, { quantity: updatedQuantity });
            console.log(`Stock updated successfully for ${name}. Remaining quantity: ${updatedQuantity}`);
          }
        })
      );
      alert('Stock updated successfully!');
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Error updating stock. Please check stock availability.');
    }
  };
  


  return (
    <GestureHandlerRootView style={styles.container}>
      <Header />
      <View style={styles.rows}>
        {/* Product List */}
        <View style={[styles.col, { width: screenWidth / 2 + screenWidth / 6 }]}>
          <View style={styles.row}>
            <TextInput
              placeholderTextColor="#1E2A5E"
              style={[styles.input, { flex: 1, marginRight: 5 }]}
              placeholder="Search Products"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Picker
              selectedValue={productCategory}
              onValueChange={(itemValue) => {
                setProductCategory(itemValue);
              }}
              style={[styles.picker, { width: '40%' }]}
            >
              {categories.map((category, index) => (
                <Picker.Item key={index} label={category} value={category} />
              ))}
            </Picker>
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item,index) => index}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handlePress(item)} style={styles.productItem}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Ordered Food List */}
        <View style={[styles.cola, { width: screenWidth / 2 - screenWidth / 6 }]}>
          <Text style={styles.header}>Ordered Food</Text>
          <View style={styles.orderedFoodContainer}>
            <FlatList
              data={orderedFood}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.orderedItem}>
                  <Text style={styles.orderedItemName}>{item.name}</Text>
                  <Text style={styles.orderedItemPrice}>${item.price.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => handleRemove(index)} style={styles.removeButton}>
                    <Icon name="trash-outline" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
          <Text style={styles.totalAmount}>Total: ${totalAmount.toFixed(2)}</Text>          
          <View style={styles.orderDetailsContainer}>    
            <TextInput
              style={styles.tableInput}
              placeholder="Table No"
              keyboardType="numeric" // Ensure only numeric input
              value={tableNo}
              onChangeText={setTableNo}
            />
            <Pressable style={styles.button} onPress={printOrder} disabled={loading}>
              <Text style={styles.buttonText}>Print Order</Text>
            </Pressable>
          </View>

          {loading && <ActivityIndicator size="large" color="#0000ff" />}
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7e0',
  },
  rows: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  col: {
    padding: 10,
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
  },
  cola: {
    padding: 10,
    backgroundColor: '#ffff',
    borderRadius: 10,
    margin: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginLeft: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#1E2A5E',
    borderRadius: 5,
    padding: 10,
    marginRight: 5,
    backgroundColor: '#fff7e0',
  },
  picker: {
    color: '#1E2A5E',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
  },
  productItem: {
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
  productName: {
    color: '#1E2A5E',
    fontSize: 16,
  },
  productPrice: {
    fontSize: 14,
    color: '#1E2A5E',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1E2A5E',
  },
  orderedFoodContainer: {
    height: Dimensions.get('window').height / 3,
  },
  orderedItem: {
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
  orderedItemName: {
    fontSize: 16,
    color: '#1E2A5E',
  },
  orderedItemPrice: {
    color: '#1E2A5E',
    fontSize: 16,
  },
  removeButton: {
    padding: 5,
  },
  totalAmount: {
    color: '#1E2A5E',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderDetailsContainer: {
    justifyContent: 'center',
    alignContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tableInput: {
    borderWidth: 1,
    borderColor: '#1E2A5E',
    borderRadius: 5,
    padding: 10,
    marginRight: 5,
    width: 100, // Set a width for the table input
  },
  button: {
    backgroundColor: '#1E2A5E',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default Order;
