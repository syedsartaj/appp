import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Modal, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { db } from '../firebaseConfig'; // Update to your firebase file path
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Header from '../Components/Header';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';

const Products = () => {
  const [Stock, setStock] = useState([]);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productQuantity, setProductQuantity] = useState('');
  const [ingredientId ,   setIngredientId  ] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [products, setProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('');
  const [editingIngredientIndex, setEditingIngredientIndex] = useState(null);
  const [userCcode, setUserCcode] = useState('');

  const categories = ['Main Course', 'Desserts', 'Starters', 'Lunch', 'Breakfast'];

  useEffect(() => {
    const fetchCcode = async () => {
      const code = await AsyncStorage.getItem('userCcode');
      if (code) {
        setUserCcode(code);
        fetchProductsFromAPI(code);
        fetchStockData(code);
      } else {
        Alert.alert('Code not found');
      }
    };
    fetchCcode();
  }, []);

  // Fetch products from Firestore
  const fetchProductsFromAPI = async (code) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products')); // Assuming 'products' is the collection name
      const productsData = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        ingredients: doc.data().ingredients || [],
      }));
      setProducts(productsData);
      console.log(productsData);
    } catch (error) {
      console.error('Error fetching products:', error.message);
    }
  };
  
  const handleEditProduct = (product) => {
    setProductName(product.name);
    setProductPrice(product.price.toString());
    setProductCategory(product.category);
    setProductQuantity(product.quantity);
    setIngredients(product.ingredients ? product.ingredients : []);
    setEditingProductId(product.id);
    setEditModalVisible(true);
  };
  const addIngredient = () => {
    if (!ingredientName || !ingredientQuantity) {
      Alert.alert('Please fill in all fields for ingredients');
      return;
    }
    const updatedIngredients = editingIngredientIndex !== null
      ? ingredients.map((ingredient, index) =>
          index === editingIngredientIndex ? { name: ingredientName, quantity: parseInt(ingredientQuantity), id:ingredientId } : ingredient
        )
      : [...ingredients, { name: ingredientName, quantity: parseInt(ingredientQuantity),id:ingredientId }];
  
    setIngredients(updatedIngredients);
    setIngredientName('');
    setIngredientQuantity('');
    setEditingIngredientIndex(null);
  };
  
  // Fetch stock data from Firestore (add stock document IDs)
  const fetchStockData = async (code) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'stock')); // Assuming 'stock' is the collection name
      const stockData = querySnapshot.docs.map((doc) => ({
        name: doc.data().name,
        id: doc.id, // Capture the document ID as well
        quantity : doc.data().quantity,
      }));
      setStock(stockData);
      console.log(stockData);
    } catch (error) {
      console.error('Error fetching stock data:', error.message);
    }
  };

  // Save products to AsyncStorage
  const saveProductsToStorage = async (updatedProducts) => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
      setProducts(updatedProducts);
    } catch (error) {
      console.error('Error saving products to storage:', error.message);
    }
  };

  const addOrUpdateProduct = async () => {
    if (!productName || !productPrice || !productCategory || ingredients.length === 0) {
      Alert.alert('Please fill in all fields and add at least one ingredient');
      return;
    }

    const productData = {
      name: productName,
      price: parseFloat(productPrice),
      category: productCategory,
      quantity: parseInt(productQuantity),
      ingredients: ingredients,
      ccode: userCcode,
    };

    try {
      if (editingProductId) {
        const productDocRef = doc(db, 'products', editingProductId); // Reference to the product document
        await updateDoc(productDocRef, productData); // Update the product
        const updatedProducts = products.map((product) =>
          product.id === editingProductId ? { ...productData, id: editingProductId, ingredients } : product
        );
        saveProductsToStorage(updatedProducts);
      } else {
        const docRef = await addDoc(collection(db, 'products'), productData);
        saveProductsToStorage([...products, { ...productData, id: docRef.id, ingredients }]);
      }
      clearInputs();
    } catch (error) {
      Alert.alert('Error saving product:', error.message);
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId) => {
    const ccode = await AsyncStorage.getItem('userCcode'); 

    Alert.alert(
      'Delete Confirmation',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const productDocRef = doc(db, 'products', productId); // Reference to the product document
              await deleteDoc(productDocRef); // Delete the product
              const updatedProducts = products.filter((product) => product.id !== productId);
              saveProductsToStorage(updatedProducts);
              Alert.alert('Success', 'Product deleted successfully');
            } catch (error) {
              console.error('Error deleting product:', error.message);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  // Clear input fields
  const clearInputs = () => {
    setProductName('');
    setProductPrice('');
    setProductCategory('');
    setProductQuantity('');
    setIngredients([]);
    setEditingProductId(null);
    setAddModalVisible(false);
    setEditModalVisible(false);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <Header />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Products</Text>
          <TouchableOpacity onPress={() => setAddModalVisible(true)} style={styles.button}>
            <Icon name="plus" size={20} color="#fff" />
            <Text style={styles.buttonText}> Add Products</Text>
          </TouchableOpacity>
        </View>

        {/* FlatList is now wrapped in a container with flexible height */}
        <FlatList
  data={products}
  keyExtractor={(item, index) => index.toString()}
  renderItem={({ item }) => (
    <View style={styles.productItem}>
      <Text style={styles.productText}>{item.name}</Text>
      <Text style={styles.productText}>${item.price.toFixed(2)}</Text>
      <Text style={styles.productText}>{item.category}</Text>
      <Text style={styles.productText}>Quantity: {item.quantity}</Text>
      <Text style={styles.productText}>Ingredients:</Text>
      {Array.isArray(item.ingredients) && item.ingredients.length > 0 ? (
        item.ingredients.map((ingredient, index) => (
          <Text key={index} style={styles.ingredientText}>
            {`${ingredient.name}: ${ingredient.quantity}`} 
          </Text>
        ))
      ) : (
        <Text>No ingredients available</Text>
      )}
      <View style={styles.actions}>
        <Pressable onPress={() => handleEditProduct(item)} style={styles.action}>
          <Icon name="edit" size={20} color="#1E2A5E" />
        </Pressable>
        <Pressable onPress={() => handleDeleteProduct(item.id)} style={styles.action}>
          <Icon name="trash" size={20} color="red" />
        </Pressable>
      </View>
    </View>
  )}
/>
      </View>
      {/* Add Product Modal */}
      <Modal
  animationType="slide"
  transparent={true}
  visible={isAddModalVisible}
  onRequestClose={() => setAddModalVisible(false)}
>
  <View style={styles.modalContainer}>
  <ScrollView >
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Add Product</Text>
      <View style={styles.modalContents}>
      <TextInput
        placeholderTextColor="#1E2A5E"
        placeholder="Product Name"
        value={productName}
        onChangeText={setProductName}
        style={styles.input}
      />
      <TextInput
        placeholderTextColor="#1E2A5E"
        placeholder="Product Price"
        value={productPrice}
        onChangeText={setProductPrice}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        placeholderTextColor="#1E2A5E"
        placeholder="Product Quantity"
        value={productQuantity}
        onChangeText={setProductQuantity}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Category Picker */}
      <Picker
        selectedValue={productCategory}
        onValueChange={(itemValue) => setProductCategory(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select Category" value="" />
        {categories.map((category) => (
          <Picker.Item key={category} label={category} value={category} />
        ))}
      </Picker>
        </View>
      <Text style={styles.modalSubtitle}>Ingredients:</Text>

      {/* List Existing Ingredients */}
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientRow}>
          <Text style={styles.ingredientText}>{`${ingredient.name}: ${ingredient.quantity}`}</Text>
          <Pressable onPress={() => handleEditIngredient(index)} style={styles.editIngredientButton}>
            <Text style={styles.editIngredientText}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => handleDeleteIngredient(index)} style={styles.deleteIngredientButton}>
            <Text style={styles.deleteIngredientText}>Delete</Text>
          </Pressable>
        </View>
      ))}

      {/* Ingredient Picker */}
            <Picker
        selectedValue={ingredientName}
        onValueChange={(itemValue) => {
          setIngredientName(itemValue.name); // Set the name
          setIngredientId(itemValue.id);    // Set the id
        }}
      >
        {Stock.map((item) => (
          <Picker.Item
            key={item.id}
            label={item.name}
            value={item} // Pass the entire item
          />
        ))}
      </Picker>

      {/* Ingredient Quantity Input */}
      <TextInput
        placeholderTextColor="#1E2A5E"
        placeholder="Ingredient Quantity"
        value={ingredientQuantity}
        onChangeText={setIngredientQuantity}
        keyboardType="numeric"
        style={styles.input}
      />
       <View style={styles.modalContents}>
      {/* Add Ingredient Button */}
      <Pressable style={styles.button} onPress={addIngredient}>
        <Text style={styles.buttonText}>{editingIngredientIndex !== null ? 'Update Ingredient' : 'Add Ingredient'}</Text>
      </Pressable>

      {/* Save Product Button */}
      <Pressable style={styles.button} onPress={addOrUpdateProduct}>
        <Text style={styles.buttonText}>Add Product</Text>
      </Pressable>

      {/* Close Modal Button */}
      <Pressable style={[styles.button, { backgroundColor: 'red' }]} onPress={() => setAddModalVisible(false)}>
        <Text style={styles.buttonText}>Cancel</Text>
      </Pressable>
      </View>
    </View>
    </ScrollView>
  </View>
</Modal>

      {/* Edit Product Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
        <ScrollView >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            <View style={styles.modalContents}>
            <TextInput
              placeholderTextColor="#1E2A5E"
              placeholder="Product Name"
              value={productName}
              onChangeText={setProductName}
              style={styles.input}
            />
            <TextInput
              placeholderTextColor="#1E2A5E"
              placeholder="Product Price"
              value={productPrice}
              onChangeText={setProductPrice}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholderTextColor="#1E2A5E"
              placeholder="Product Quantity"
              value={productQuantity}
              onChangeText={setProductQuantity}
              keyboardType="numeric"
              style={styles.input}
            />
            <Picker
              selectedValue={productCategory}
              onValueChange={(itemValue) => setProductCategory(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Select Category" value="" />
              {categories.map((category) => (
                <Picker.Item key={category} label={category} value={category} />
              ))}
            </Picker>
            </View>
            <Text style={styles.modalSubtitle}>Ingredients:</Text>
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientRow}>
                <Text style={styles.ingredientText}>{`${ingredient.name}: ${ingredient.quantity}`}</Text>
                <Pressable onPress={() => handleEditIngredient(index)} style={styles.editIngredientButton}>
                  <Text style={styles.editIngredientText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => handleDeleteIngredient(index)} style={styles.deleteIngredientButton}>
                  <Text style={styles.deleteIngredientText}>Delete</Text>
                </Pressable>
              </View>
            ))}
              <Picker
        selectedValue={ingredientName}
        onValueChange={(itemValue) => {
          setIngredientName(itemValue.name); // Set the name
          setIngredientId(itemValue.id);    // Set the id
        }}
      >
        {Stock.map((item) => (
          <Picker.Item
            key={item.id}
            label={item.name}
            value={item} // Pass the entire item
          />
        ))}
      </Picker>
            <TextInput
              placeholderTextColor="#1E2A5E"
              placeholder="Ingredient Quantity"
              value={ingredientQuantity}
              onChangeText={setIngredientQuantity}
              keyboardType="numeric"
              style={styles.input}
            />
            <View style={styles.modalContents}>
            <Pressable style={styles.button} onPress={addIngredient}>
              <Text style={styles.buttonText}>{editingIngredientIndex !== null ? 'Update Ingredient' : 'Add Ingredient'}</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={addOrUpdateProduct}>
              <Text style={styles.buttonText}>{editingProductId ? 'Update Product' : 'Add Product'}</Text>
            </Pressable>
            <Pressable style={[styles.button, { backgroundColor: 'red' }]} onPress={() =>setEditModalVisible(false)}>
        <Text style={styles.buttonText}>Cancel</Text>
      </Pressable>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  content: {
    flex: 1,
    padding: 14,
    backgroundColor: '#fff7e0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    color:'#1E2A5E',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#1E2A5E',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 5,
  },
  modalContents: {
   flexDirection:'row',
   justifyContent:'space-between',
   alignItems:'center',
  },
  productItem: {
    backgroundColor: '#fff',
    borderRadius:2,
    margin:5,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  productText: {
    fontSize: 16,
    color:'#1E2A5E',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  action: {
    marginLeft: 15,
  },
  ingredientText: {
    fontSize: 14,
    color:'#1E2A5E',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    color:'#1E2A5E',
    fontSize: 24,
    marginBottom: 20,
  },
  modalSubtitle: {
    color:'#1E2A5E',
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  picker: {
    color:'#1E2A5E',
    height: 50,
    width: '20%',
    marginVertical: 10,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  editIngredientButton: {
    marginRight: 10,
  },
  editIngredientText: {
    color: 'blue',
  },
  deleteIngredientButton: {
    marginRight: 10,
  },
  deleteIngredientText: {
    color: 'red',
  },
});

export default Products;
