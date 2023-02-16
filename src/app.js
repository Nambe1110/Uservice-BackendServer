import express from 'express';
const app = express();

app.get('/', (req, res) => {
    res.status(200).send({
        status: "success",
        data: {
            message: "API is working. Server is running on port 7502"
        }
    });
});
const PORT = process.env.PORT || 7502;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

