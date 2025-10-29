import { Page } from "components/shared/Page";
import { useSmartContract } from "../../../../hooks/useSmartContract";
import { useEffect, useState } from "react";
import { PropTypes } from "prop-types";
import { Badge } from "components/ui";

export default function Tree() {
 
  const {
    address,
    CrowdVaultContract
  } = useSmartContract();
  
  const [head,setHead] = useState(null);
  const [children, setChildren] = useState([]); // Store children addresses
  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState('');
  const [parentLevel, setParentLevel] = useState('');
  const [level, setLevel] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    let isMounted = true; // track if component is still mounted
  
    const fetchAffiliateData = async () => {
      if (!address || !CrowdVaultContract) return;
      
      const root = head ? head : address;
  
      try {
        //const adata = await getChildren(root);
        
        if (!isMounted) return; 
        const childrenBatch = await CrowdVaultContract.getChildren(true, root, 0, 100);
        // Fetch level for each child
        const childrenWithLevels = await Promise.all(
          childrenBatch.map(async (child) => {
            const [parent, agent, level] = await CrowdVaultContract.getAffiliateData(child);
            return {
              address: child,
              level: parseInt(level) < 1?0:parseInt(level)-1,
              parent,
              agent,
            };
          })
        );

        const affiliates = await CrowdVaultContract.getAffiliateData(root);

        const childrenList = Array.isArray(childrenWithLevels) ? childrenWithLevels : [];
        const getParent = Array.isArray(affiliates) ? affiliates[0] : root;
        const getParentLevel = Array.isArray(affiliates) ? parseInt(affiliates[2]) < 1?0:parseInt(affiliates[2])-1   : 0;
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
          setIsLoaded(true);
        }
      }
    };

    if( !isLoaded ) {
      fetchAffiliateData();
    }
    return () => {
      isMounted = false; // cleanup
    };
  }, [CrowdVaultContract,address,head,isLoaded]); // keep only stable deps

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
            onClick={() => { if( address!=head && head!=null && level>1){
              setHead(parent); 
              setLevel(level-1); 
              setIsLoaded(false);
            }}}
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
                      setIsLoaded(false);
                    }
                  } 
                }>{parseInt(child.level)}</Badge>
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