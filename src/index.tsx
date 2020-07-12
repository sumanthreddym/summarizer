import ForgeUI, {
  render,
  useConfig,
  Fragment,
  Text,
  Macro,
  useAction,
  useState,
  Button,
  useProductContext,
} from "@forge/ui";
import api from "@forge/api";

const SUMMARIZER_URL = "https://d1fzd9muw39rgw.cloudfront.net";

const App = () => {
  const { contentId } = useProductContext();
  let [isGenerated, setIsGenerated] = useState(false);

  const [data] = useAction(
    () => null,
    async () => await getContent(contentId)
  );

  var jsonObj = JSON.parse(data.body.atlas_doc_format.value);
  var text = getValues(jsonObj, "text").join(" ");

  let [summary, setSummary] = useAction(async () => await getSummary(text), "");

  return (
    <Fragment>
      <Text content="**Summary**" />
      <Text
        content={
          summary
            ? summary.join(" ")
            : "Click on **Generate Summary** button below to generate short summary for the above content."
        }
      />

      {isGenerated ? (
        <Text content="" />
      ) : (
        <Button
          text="Generate Summary"
          onClick={() => {
            setIsGenerated(true);
            setSummary();
          }}
        />
      )}
    </Fragment>
  );
};

const getContent = async (contentId) => {
  const response = await api
    .asApp()
    .requestConfluence(
      `/wiki/rest/api/content/${contentId}?expand=body.atlas_doc_format`
    );

  if (!response.ok) {
    const err = `Error while get_content with contentId ${contentId}: ${response.status} ${response.statusText}`;
    console.error(err);
    throw new Error(err);
  }
  return await response.json();
};

function getValues(obj, key) {
  var objects = [];
  for (var i in obj) {
    if (!obj.hasOwnProperty(i)) continue;
    if (typeof obj[i] == "object") {
      objects = objects.concat(getValues(obj[i], key));
    } else if (i == key) {
      objects.push(obj[i]);
    }
  }
  return objects;
}

const getSummary = async (data) => {
  data = {
    text: data,
    url: "",
  };

  let opts = {};
  opts = Object.assign({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const response = await api.fetch(SUMMARIZER_URL, opts);

  if (!response.ok) {
    const err = `Error invoking ${SUMMARIZER_URL} (Slack): ${response.status} ${response.statusText}`;
    throw new Error(err);
  }
  const responseBody = await response.json();
  return responseBody.summary;
};

export const run = render(<Macro app={<App />} />);
