import InfoKontakGor from '../models/infoKontakGorModel.js';

// Controller to get all InfoKontakGor data
export const getInfoKontakGor = async (req, res) => {
  try {
    // Find all the documents in the InfoKontakGor collection
    const infoKontakGorData = await InfoKontakGor.find();
    
    // If no data found
    if (!infoKontakGorData.length) {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }

    // Send the response with the data
    res.status(200).json(infoKontakGorData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};
