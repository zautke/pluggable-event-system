# Vector Search Notes

Vector search stores numeric embeddings with payload metadata. Collections group points that share a dimensionality and distance metric.

Indexers prepare mutations from chunk text and embedding batches. Vector stores apply those mutations and return collection references for retrievers.

Retrieval quality depends on chunk boundaries, embedding model choice, metadata filters, and the vector database index configuration.
