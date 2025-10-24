import { Page } from "components/shared/Page";
import { useSmartContract } from "../../../../hooks/useSmartContract";
import { useEffect, useState } from "react";
import { PropTypes } from "prop-types";
import { Badge } from "components/ui";

export default function Tree() {
 
  const {
    address,
    getChildren,
  } = useSmartContract();
  
  const [head,setHead] = useState(null);
  const [children, setChildren] = useState([]); // Store children addresses
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState('');
  const [parentLevel, setParentLevel] = useState('');
  const [level, setLevel] = useState(1);
  
  useEffect(() => {
    let isMounted = true; // track if component is still mounted
  
    const fetchAffiliateData = async () => {
      if (!address) return;
  
      const root = head ? head : address;
  
      try {
        const adata = await getChildren(root);
        
        if (!isMounted) return; 

        const childrenList = Array.isArray(adata.children) ? adata.children : [];
        const getParent = Array.isArray(adata.affiliates) ? adata.affiliates[0] : root;
        const getParentLevel = Array.isArray(adata.affiliates) ? adata.affiliates[2] : 0;
        //const isBroker = Array.isArray(adata.affiliates) ? adata.affiliates[3] : 0;

        console.log(childrenList);
        setChildren(childrenList);
        setParent(getParent);
        setParentLevel(getParentLevel);
    
      } catch (error) {
        if (isMounted) {
          console.error("Failed to fetch affiliate data:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
  
    fetchAffiliateData();
  
    return () => {
      isMounted = false; // cleanup
    };
  }, [address, head, getChildren]); // keep only stable deps

  return (
    <Page title="Network Tree">
      <div className="max-w-xs p-10">
  
        <Badge color="primary">Level {level}</Badge>
        <div className="d-flex flex-column flex-row-fluid gap-2 m-2">
        <div
            className="btn btn-primary w-100 mb-3"
            style={{ textAlign: 'left', padding: '0px' }}
        >
          <Badge color="error" className="rounded-full me-1" 
            onClick={() => { if( address!=head && head!=null && level>1){setHead(parent); setLevel(level-1); }}}
          >{parentLevel}</Badge>
          <Badge>{!head?address:head}</Badge>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : children.length === 0 ? (
          <p>No direct found.</p>
        ) : (
          <div className="d-flex flex-column flex-row-fluid gap-2 m-2 w-100">
            {children.map((child, index) => (
              <div
                key={index}
                className="d-flex flex-column mb-3"
                style={{ textAlign: 'left', padding: '0px' }}
              >
                <Badge color={child.address==child.broker?'info':'primary'}  className="me-1" onClick={() => { 
                    if( head!=child.address) {
                      setHead(child.address);
                      setLevel(level+1);
                    }
                  } 
                }>{child.level}</Badge>
                <Badge>{child.address}</Badge>
                
              </div>
            ))}
          </div>
        )}  
        
      </div>
    </Page>
  );
}

Tree.propTypes = {
  tree: PropTypes.array,
};