import { Layout, Row, Col, Button, Spin } from "antd";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";
import { Aptos } from "@aptos-labs/ts-sdk";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState} from 'react';



export const aptos = new Aptos();
export const moduleAddress = "013aaf1a1ed515d91f2ad2027d5dd56c68be569022a5a2a07d16b1cd82919016";

type Task = {
  address: string;
  completed: boolean;
  content: string;
  task_id: string;
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { account, signAndSubmitTransaction } = useWallet();
  const [accountHasList, setAccountHasList] = useState<boolean>(false);
  const [transactionInProgress, setTransactionInProgress] =useState<boolean>(false);
  
  const fetchList = async () => {
    if (!account) return [];
    // change this to be your module account address
    try {
      const todoListResource = await aptos.getAccountResource(
        {
          accountAddress:account?.address,
          resourceType:`${moduleAddress}::todolist::TodoList`
        }
      );
      setAccountHasList(true);
      	// tasks table handle
    const tableHandle = (todoListResource as any).tasks.handle;
		// tasks table counter
    const taskCounter = (todoListResource as any).task_counter;

    let tasks = [];
    let counter = 1;
    while (counter <= taskCounter) {
      const tableItem = {
        key_type: "u64",
        value_type: `${moduleAddress}::todolist::Task`,
        key: `${counter}`,
      };
      const task = await aptos.getTableItem<Task>({handle:tableHandle, data:tableItem});
      tasks.push(task);
      counter++;
    }
		// set tasks in local state
    setTasks(tasks);
    } catch (e: any) {
      setAccountHasList(false);
    }
  };

  const addNewList = async () => {
    if (!account) return [];
    setTransactionInProgress(true);
     const transaction:InputTransactionData = {
        data: {
          function:`${moduleAddress}::todolist::create_list`,
          functionArguments:[]
        }
      }
    try {
      // sign and submit transaction to chain
      const response = await signAndSubmitTransaction(transaction);
      // wait for transaction
      await aptos.waitForTransaction({transactionHash:response.hash});
      setAccountHasList(true);
    } catch (error: any) {
      setAccountHasList(false);
    } finally {
      setTransactionInProgress(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [account?.address]);

  return (
    <>
      <Layout>
        <Row align="middle">
          <Col span={10} offset={2}>
            <h1>Our todolist</h1>
          </Col>
          <Col span={12} style={{ textAlign: "right", paddingRight: "200px" }}>
            <WalletSelector />
          </Col>
        </Row>
      </Layout>
      <Spin spinning={transactionInProgress}>
      {!accountHasList && (
        <Row gutter={[0, 32]} style={{ marginTop: "2rem" }}>
          <Col span={8} offset={8}>
            <Button
              onClick={addNewList}
              block
              type="primary"
              style={{ height: "40px", backgroundColor: "#3f67ff" }}
            >
              Add new list
            </Button>
          </Col>
        </Row>
      )}
    </Spin>
    </>
  );
}

export default App;
