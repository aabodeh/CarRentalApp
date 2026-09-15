import { StyleSheet, Text, View } from 'react-native';

export default function CarListScreen() {
  return (
    <View style={styles.container}>
      <Text>Car List</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
