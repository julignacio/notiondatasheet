import React from 'react';
import axios from "axios";
import { Table } from './Components/Table';
import styled from 'styled-components';
import { useSearchParams } from "react-router-dom";

const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }

      input {
        font-size: 1rem;
        padding: 0;
        margin: 0;
        border: 0;
      }
    }
  }
`;

function App() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'Owner',
        accessor: 'owner'

      },
      {
        Header: 'Stocks',
        accessor: 'stocks'
      },
      {
        Header: ' ',
      }
    ],
    []
  );

  const [data, setData] = React.useState([{}, {}, {}, {}]);
  const [authorized, setAuthorized] = React.useState(false);
  const [refresh, setRefresh] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();


  const updateMyData = async (rowIndex, columnId, value) => {
    let editedRow = null;
    setData(old =>
      old.map((row, index) => {
        if (index === rowIndex) {
          editedRow = { ...row, [columnId]: value };
          return {
            ...old[rowIndex],
            [columnId]: value,
          }
        }
        return row
      })
    )

    var formdata = new FormData();
    formdata.append("id", editedRow.id);
    formdata.append("owner", editedRow.owner);
    formdata.append("stocks", editedRow.stocks);
    if (editedRow) {
      const res = await axios.patch('http://localhost:8000/edit', {
        ...editedRow
      })
      return res;
    }
  };

  
  React.useEffect(() => {
    const authorize = async (code) => {
      const auth = await axios.post("http://localhost:8000/auth", { code });
      if(auth.status === 200) {
        setAuthorized(true);
        setSearchParams({code: searchParams.get('code'), status: '200'})
      }
    }
    const code = searchParams.get('code');
    const status = searchParams.get('status');
    if(code && status !== 200) {
      authorize(code);
    }
    if(status === 200) {
      console.log('exec');
      (async () => {
        const newData = await axios.get("http://localhost:8000");
        setData([...newData.data, {}]);
      })()
    }
  }, [refresh, searchParams, setSearchParams]);

  return (
    <Styles>
      <button onClick={() => setRefresh(!refresh)}>Refresh</button>
      <Table
        columns={columns}
        data={data}
        updateMyData={updateMyData}
      />
      <a href='https://api.notion.com/v1/oauth/authorize?client_id=141f3936-bc26-44ff-b966-b65d4e539f07&response_type=code&owner=user&redirect_uri=http%3A%2F%2Flocalhost%3A3000'>Connect to Notion</a>
    </Styles>
  );
};

export default App;
