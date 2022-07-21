import { useEffect, useState } from 'react';
import { Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { VStack, Text, HStack, useTheme, ScrollView, Box } from 'native-base';
import firestore from '@react-native-firebase/firestore'

import { CircleWavyCheck, Hourglass, DesktopTower, ClipboardText } from 'phosphor-react-native'

import { OrderFirestoreDTO } from '../DTOs/OrderFirestoreDTO';
import { dateFormat } from '../utils/firestoreDateFormat';

import { Header } from '../components/Header';
import { OrderProps } from '../components/Order';
import { Loading } from '../components/Loading';
import { CardDetails } from '../components/CardDetails'
import { Input } from '../components/Input';
import { Button } from '../components/Button';

type RouteParams = {
  orderId: string;
}

type OrderDetails = OrderProps & {
  description: string;
  solution: string;
  closed: string;
}

export function Details() {
  const [order, setOrder] = useState<OrderDetails>({} as OrderDetails)
  const [solution, setSolution] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const { colors } = useTheme();
  
  const navigation = useNavigation();
  const route = useRoute();
  
  const { orderId } = route.params as RouteParams;

  function handleOrderClose(){
    setButtonLoading(true);
    if(!solution){
      setButtonLoading(false);
      return Alert.alert('Encerrar Solicitação', 'Acrescente uma solução')
    }

    firestore()
    .collection<OrderFirestoreDTO>('orders')
    .doc(orderId)
    .update({
      status:'closed',
      solution,
      closed_at: firestore.FieldValue.serverTimestamp()
    })
    .then(()=>{
      Alert.alert('Solicitação','Solicitação Encerrada');
      navigation.goBack();
    })
    .catch((error) =>{
      console.error(error);
      Alert.alert('Solicitação','Não foi possível encerrar a solicitação')
    })
    
  }

  useEffect(() => {
    firestore()
      .collection<OrderFirestoreDTO>('orders')
      .doc(orderId)
      .get()
      .then((doc) => {
        const { patrimony, description, status, created_at, closed_at, solution } = doc.data();

        const closed = closed_at ? dateFormat(closed_at) : null;

        setOrder({
          id: doc.id,
          patrimony,
          description,
          status,
          solution,
          when: dateFormat(created_at),
          closed
        });

        setIsLoading(false)
      })
  }, []);

  if (isLoading) {
    return <Loading />
  }

  return (
    <VStack flex={1} bg='gray.700'>
      <Header title='Solicitação' px={6}/>
      <HStack bg='gray.500' justifyContent='center' p={4}>
        {
          order.status === 'closed'
            ? <CircleWavyCheck size={22} color={colors.green[300]} />
            : <Hourglass size={22} color={colors.secondary[700]} />
        }

        <Text
          fontSize='sm'
          color={order.status === 'closed'
            ? colors.green[300]
            : colors.secondary[700]
          }
          ml={2}
          textTransform='uppercase'
        >
          {
            order.status === 'closed'
            ? 'finalizado'
            : 'Em andamento'
          }
        </Text>
      </HStack>
      <ScrollView mx={5} showsVerticalScrollIndicator={false}>
          <CardDetails
            title='Equipamento'
            description={`Patrimônio ${order.patrimony}`}
            icon={DesktopTower}
          />
          <CardDetails
            title='Descrição do Problema'
            description={`${order.description}`}
            icon={ClipboardText}
            footer={`Registrado em ${order.when}`}
          />
          <CardDetails
            title='Solução'
            icon={CircleWavyCheck}
            footer={order.closed && `Encerrado em ${order.closed}`}
          >
            {
              order.status === 'open' 
              ? <Input
              placeholder='Descrição da Solução'
              onChangeText={setSolution}
              textAlignVertical='top'
              multiline
              bg='gray.400'
              h={24}
              />
              : <Text color='white' fontSize='sm'> {order.solution}</Text>
            }
          </CardDetails>
      </ScrollView>
      {
        order.status === 'open' && 
        <Button 
        title='Encerrar Solicitação'
        m={5}
        onPress={handleOrderClose}
        isLoading={buttonLoading}
        />
        
      }
    </VStack>
  );
}