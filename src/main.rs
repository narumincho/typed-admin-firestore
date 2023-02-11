#[tokio::main]
pub async fn main() -> anyhow::Result<()> {
    let result = reqwest::get(
        "https://raw.githubusercontent.com/googleapis/nodejs-firestore/main/types/firestore.d.ts",
    )
    .await?
    .text()
    .await?;
    println!("{}", result);
    Ok(())
}
