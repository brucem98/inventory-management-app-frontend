import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { ModalDialog } from "./ModalDialog";

const GET_ALL = gql`
  query GetCategories {
    allCategories {
      nodes {
        nodeId
        id
        description
      }
    }
  }
`;

const ADD_ENTITY = gql`
  mutation AddCategory($description: String!) {
    createCategory(input: { category: { description: $description } }) {
      category {
        nodeId
      }
    }
  }
`;

const DELETE_ENTITY = gql`
  mutation DeleteCategory($nodeId: ID!) {
    deleteCategory(input: { nodeId: $nodeId }) {
      deletedCategoryId
    }
  }
`;

const UPDATE_ENTITY = gql`
  mutation UpdateCategory($nodeId: ID!, $description: String!) {
    updateCategory(
      input: { nodeId: $nodeId, categoryPatch: { description: $description } }
    ) {
      category {
        nodeId
      }
    }
  }
`;

interface AllEntity {
  allCategories: { nodes: Entity[] };
}

interface Entity {
  nodeId?: string;
  id?: number;
  description?: string;
}

const entityName = "Category";

export const Categories = (props: {}) => {
    const [displayModal, setDisplayModal] = useState(false);
    const [entity, setEntity] = useState<Entity | undefined>(undefined);
   
    // Usage of the the Apollo Client's useQuery & useMutation to interact with
    // our GraphQL API
    // We use refetchQueries instead of caching the data for simplicty
    const { loading, error, data } = useQuery<AllEntity>(GET_ALL);
    
    const [addEntity, { error: errorAdding }] = useMutation(ADD_ENTITY, {
      refetchQueries: [{ query: GET_ALL }]
    });
    const [deleteEntity, { error: errorDeleting }] = useMutation(DELETE_ENTITY, {
      refetchQueries: [{ query: GET_ALL }]
    });
    const [updateEntity, { error: errorUpdating }] = useMutation(UPDATE_ENTITY, {
      refetchQueries: [{ query: GET_ALL }]
    });

    // Boilerplate Error Handling
    if (loading) return <span>Loading...</span>;
    if (error || errorAdding || errorDeleting || errorUpdating) {
        const message =
            error?.message ||
            errorAdding?.message ||
            errorDeleting?.message ||
            errorUpdating?.message;
        return <span>{`Error: ${message}`}</span>;
    }
    if (!data) return <span>No records found.</span>;

    const handleSave = () => {
        setDisplayModal(false);
        // Verifies if it's an update operation or if it should create a new entity
        // based on having an existing nodeId
        if (entity?.nodeId) {
          updateEntity({
            variables: {
              nodeId: entity.nodeId,
              description: entity.description
            }
          });
        } else {
            addEntity({ variables: { description: entity?.description } });
        }
    };

    // Renders the existing entity data into a simple table 
    const renderData = () => {
        return data.allCategories.nodes.map((entity: Entity) => {
            const { nodeId, id, description } = entity;
            return (
                <tr key={id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                            className="text-indigo-600 hover:text-indigo-900 pr-2"
                            onClick={() => {
                                setEntity(entity);
                                setDisplayModal(true);
                            }}
                        >
                            Edit 
                        </button>
                        <button
                            className="text-indigo-600 hover:text-indigo-900"
                            onClick={() => deleteEntity({ variables: { nodeId }})}>
                            Delete
                        </button>
                    </td>
                </tr>
            );
        });
    };

    return (
        <>
            {/* Very Basic Validation */}
            {displayModal && (
                <ModalDialog
                    title={`New ${entityName}`}
                    onClose={() => setDisplayModal(false)}
                    onSave={handleSave}
                    enableSave={!!entity?.description}
                    content={<EntityDetails entity={entity} setEntity={setEntity}/>}
                />
            )}
            <div className="flex flex-col">
                <div className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={() => {
                            setEntity(undefined);
                            setDisplayModal(true);
                        }}
                    >
                        New
                    </button>
                </div>
                <div className="py-2 align-middle inline-block min-w-full">
                    <div className="shadow overflow-hidden border-b border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        ID
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >                                    
                                        Description
                                    </th>
                                    <th scope="col" className="relative px-6 py-3"
                                    >
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {renderData()}
                            </tbody>
                        </table>    
                    </div>
                </div>
            </div>
        </>
    )
}

// Component that implements a visual representation of the entity details,
// to be utilized inside of the ModalDialog instance.
const EntityDetails = (props: {
    entity: Entity | undefined;
    setEntity: React.Dispatch<React.SetStateAction<Entity | undefined>>;
}) => {
    const { entity, setEntity } = props;
    return (
        <>
            <div className="grid col-span-1 m-2">
                <label
                    htmlFor="description"
                    className="form-label inline-block mb-2 ml-1"
                >
                    Description
                </label>
                <input
                    type="text"
                    onChange={(e) => setEntity({ ...entity, description: e.target.value })}
                    value={entity?.description || ""}
                    className="form-control block w-full rounded-lg mb-5"
                    id="description"
                />
            </div>
        </>
    )
}